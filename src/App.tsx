import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline, Toolbar, AppBar, Typography, Box } from "@mui/material";
import { Home, Settings, History, SimCardDownload } from "@mui/icons-material";
import { useI18n } from "./utils/I18n";
import { useMemo } from "react"
import LogPage from "./page/log";
import ProfilePage from "./page/profile";
import HomePage from "./page/home"
import ApduBackendSelector from "./page/apdu_select";

const drawerWidth = 240;

function Sidebar() {
  const keys = useMemo(() => ["home", "profile", "settings", "logs"], []);
  const texts = useI18n(keys);

  const menu = [
    { name: texts["home"] || "Home", path: "/", icon: <Home /> },
    { name: texts["profile"] || "Profile", path: "/profile", icon: <SimCardDownload /> },
    { name: texts["settings"] || "Settings", path: "/settings", icon: <Settings /> },
    { name: texts["logs"] || "Logs", path: "/logs", icon: <History /> },
  ];

  return (
    <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" } }}>
      <Toolbar />
      <List>
        {menu.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton component={Link} to={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default function App() {
  return (
    <Router>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              My New LPA
            </Typography>
          </Toolbar>
        </AppBar>
        <Sidebar />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,            // 占满剩余水平空间
            display: 'flex', 
            flexDirection: 'column',
            p: 3,
            boxSizing: 'border-box',
          }}
        >
          <Toolbar /> {/* 保留 AppBar 高度 */}
          <Box>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<ApduBackendSelector />} />
              <Route path="/logs" element={<LogPage />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </Router>
  );
}
