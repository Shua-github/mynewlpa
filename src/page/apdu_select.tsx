import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import { lpac, logger } from "../env";
import { useI18n } from "../utils/I18n";

const ApduBackendSelector: React.FC = () => {
  // i18n keys
  const keys = useMemo(() => [
    "settings.select_apdu_backend",
    "settings.backend",
    "settings.device",
    "settings.backend_not_support_device_list",
  ], []);
  const texts = useI18n(keys);

  const [backends, setBackends] = useState<string[]>([]);
  const [selectedBackend, setSelectedBackend] = useState<string>("");
  const [devices, setDevices] = useState<{ env: string; name: string }[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [deviceEnvKey, setDeviceEnvKey] = useState<string>("");

  const loadLastDevice = useCallback((envKey: string, setEnv = true) => {
    const lastDevice = lpac.getEnvKey(envKey) || "";
    if (lastDevice) {
      setSelectedDevice(lastDevice);
      if (setEnv) lpac.setEnvKey(envKey, lastDevice);
    }
  }, []);

  const handleBackendChange = useCallback(async (backend: string, setEnv = true) => {
    if (setEnv && deviceEnvKey) {
      lpac.delEnvKey(deviceEnvKey);
      setSelectedDevice("");
      setDeviceEnvKey("");
    }

    setSelectedBackend(backend);
    if (setEnv) lpac.setEnvKey("LPAC_APDU", backend);

    try {
      const apduData = await lpac.getApdus();
      if (apduData.data.length) {
        setDevices(apduData.data);
        setDeviceEnvKey(apduData.env);
        loadLastDevice(apduData.env, setEnv);
      } else {
        setDevices([]);
        setDeviceEnvKey("");
      }
    } catch (e) {
      logger.error(`Failed to fetch APDU list: ${(e as Error).message}`);
      setDevices([]);
      setDeviceEnvKey("");
    }
  }, [deviceEnvKey, loadLastDevice]);

  useEffect(() => {
    const fetchBackendsAndDefaults = async () => {
      try {
        const drv = await lpac.getDrivers();
        setBackends(drv.LPAC_APDU);

        const lastBackend = lpac.getEnvKey("LPAC_APDU") || "";
        if (lastBackend && drv.LPAC_APDU.includes(lastBackend)) {
          setSelectedBackend(lastBackend);
          await handleBackendChange(lastBackend, false);
        }
      } catch (e) {
        logger.error(`Failed to fetch drivers: ${(e as Error).message}`);
      }
    };
    fetchBackendsAndDefaults();
  }, [handleBackendChange, texts]);

  const handleDeviceChange = (device: string) => {
    setSelectedDevice(device);
    if (deviceEnvKey) {
      lpac.setEnvKey(deviceEnvKey, device);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid>
        <Card>
          <CardHeader title={texts["settings.select_apdu_backend"]} />
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>{texts["settings.backend"]}</InputLabel>
              <Select
                value={selectedBackend}
                label={texts["settings.backend"]}
                onChange={(e) => handleBackendChange(e.target.value)}
              >
                {backends.map((b) => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {devices.length ? (
              <Box mt={3}>
                <FormControl fullWidth>
                  <InputLabel>{texts["settings.device"]}</InputLabel>
                  <Select
                    value={selectedDevice}
                    label={texts["settings.device"]}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                  >
                    {devices.map((d) => (
                      <MenuItem key={d.env} value={d.env}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            ) : selectedBackend ? (
              <Typography color="text.secondary" mt={2}>
                {texts["settings.backend_not_support_device_list"]}
              </Typography>
            ) : null}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ApduBackendSelector;
