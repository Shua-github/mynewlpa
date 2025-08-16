import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button
} from '@mui/material';
import { SimCard, MoreVert } from '@mui/icons-material';
import { lpac, logger } from "../env";
import type { Profile } from "../driver/types";
import { useI18n } from "../utils/I18n";

const ProfileList: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const keys = useMemo(() => [
    "profile.index",
    "profile.raw_profile_name",
    "profile.profile_name",
    "profile.service_provider",
    "profile.state",
    "profile.enable",
    "profile.disable",
    "profile.rename"
  ], []);
  const t = useI18n(keys);

  // 获取 profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await lpac.getProfiles();
        setProfiles(data);
      } catch (error) {
        logger.error(`Failed to fetch profiles: ${error}`);
        setProfiles([]);
      }
    };
    fetchProfiles();
  }, []);

  const getProfileStateColor = (state: string) => {
    switch(state) {
      case 'enabled': return 'green';
      case 'disabled': return 'red';
      default: return 'gray';
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, profile: Profile) => {
    setMenuAnchor(event.currentTarget);
    setSelectedProfile(profile);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleToggleState = async () => {
    if (!selectedProfile) return;

    const newState: "enabled" | "disabled" =
      selectedProfile.profileState === "enabled" ? "disabled" : "enabled";

    const cliState = newState === "enabled" ? "enable" : "disable";
    try {
      const success = await lpac.switchProfile(selectedProfile.iccid, cliState);
      if (success) {
        const updatedProfiles = await lpac.getProfiles();
        setProfiles(updatedProfiles);
        logger.info(`Profile ${selectedProfile.iccid} switched to ${newState}`);
      } else {
        logger.warn(`Failed to switch profile ${selectedProfile.iccid}`);
      }
    } catch (error) {
      logger.error(`Error switching profile: ${error}`);
    }

    handleMenuClose();
    setSelectedProfile(null);
  };

  const handleRename = () => {
    if (!selectedProfile) return;
    setNewName(selectedProfile.profileNickname);
    setRenameDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleRenameConfirm = async () => {
    if (!selectedProfile) return;

    try {
      const success = await lpac.setProfileName(selectedProfile.iccid, newName);
      if (success) {
        setProfiles(prev =>
          prev.map(p =>
            p.iccid === selectedProfile.iccid ? { ...p, profileNickname: newName } : p
          )
        );
        logger.info(`Profile ${selectedProfile.iccid} renamed to ${newName}`);
      } else {
        logger.warn(`Failed to rename profile ${selectedProfile.iccid}`);
      }
    } catch (error) {
      logger.error(`Error renaming profile: ${error}`);
    } finally {
      setRenameDialogOpen(false);
      setSelectedProfile(null);
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        {profiles.map(profile => (
          <Grid key={profile.iccid}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Avatar src={profile.icon ? `data:image/${profile.iconType};base64,${profile.icon}` : undefined}>
                      {!profile.icon && <SimCard />}
                    </Avatar>
                    <Box ml={2}>
                      <Typography variant="h6">{profile.profileNickname}</Typography>
                      <Typography variant="body2">{t["profile.raw_profile_name"]}: {profile.profileName}</Typography>
                      <Typography variant="body2">{t["profile.profile_name"]}: {profile.profileNickname}</Typography>
                      <Typography variant="body2">{t["profile.service_provider"]}: {profile.serviceProviderName}</Typography>
                      <Typography variant="body2">
                        {t["profile.state"]}: 
                        <Box component="span" sx={{ color: getProfileStateColor(profile.profileState) }}>
                          {profile.profileState === "enabled" ? t["profile.enable"] : t["profile.disable"]}
                        </Box>
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={(e) => handleMenuOpen(e, profile)}>
                    <MoreVert />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleToggleState}>
          {selectedProfile?.profileState === "enabled" ? t["profile.disable"] : t["profile.enable"]}
        </MenuItem>
        <MenuItem onClick={handleRename}>{t["profile.rename"]}</MenuItem>
      </Menu>

      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>{t["profile.rename"]}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t["profile.rename"]}
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameConfirm} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfileList;
