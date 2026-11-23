'use client';
import React, { useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconAlertCircle,
  IconArrowsExchange,
  IconBuildingBank,
  IconCheck,
  IconFileInvoice,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconMoon,
  IconPalette,
  IconRefresh,
  IconRepeat,
  IconSun,
} from '@tabler/icons-react';
import { CustomizerContext } from '@/app/context/customizerContext';
import NotifyFinLogo from '@/app/components/shared/NotifyFinLogo';
import { NAV_ITEMS, type NavItem } from './nav-items';

const SIDEBAR_WIDTH = 270;
const MINI_SIDEBAR_WIDTH = 84;

const COLOR_THEMES = [
  { id: 'BLUE_THEME', label: 'Modernize Blue', color: '#5D87FF' },
  { id: 'AQUA_THEME', label: 'Aqua', color: '#0074BA' },
  { id: 'GREEN_THEME', label: 'Esmeralda', color: '#0A7EA4' },
  { id: 'PURPLE_THEME', label: 'Roxo', color: '#763EBD' },
  { id: 'ORANGE_THEME', label: 'Laranja', color: '#FA896B' },
];

function renderNavIcon(iconName: NavItem['iconName'], size = 20) {
  switch (iconName) {
    case 'dashboard':
      return <IconLayoutDashboard size={size} stroke={1.75} />;
    case 'transactions':
      return <IconArrowsExchange size={size} stroke={1.75} />;
    case 'accounts':
      return <IconBuildingBank size={size} stroke={1.75} />;
    case 'recurring':
      return <IconRepeat size={size} stroke={1.75} />;
    case 'reviews':
      return <IconAlertCircle size={size} stroke={1.75} />;
    case 'documents':
      return <IconFileInvoice size={size} stroke={1.75} />;
    case 'sync':
      return <IconRefresh size={size} stroke={1.75} />;
  }
}

export interface ShellUserInfo {
  displayName: string;
  email: string;
  openReviewsCount: number;
  recurringCandidatesCount: number;
}

interface DashboardShellProps {
  user: ShellUserInfo;
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const {
    activeMode,
    toggleMode,
    activeTheme,
    setActiveTheme,
    isCollapse,
    setIsCollapse,
    isMobileSidebar,
    setIsMobileSidebar,
  } = useContext(CustomizerContext);

  const [paletteAnchor, setPaletteAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const isMini = isDesktop && isCollapse === 'mini-sidebar';
  const sidebarWidth = isMini ? MINI_SIDEBAR_WIDTH : SIDEBAR_WIDTH;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const currentNav =
    NAV_ITEMS.find((item) => isActive(item.href)) ?? NAV_ITEMS[0];

  const mobileNavItems = NAV_ITEMS.filter((item) => item.mobilePrimary);

  const initials = user.displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'NF';

  const getBadgeCount = (id: string) => {
    if (id === 'reviews') return user.openReviewsCount;
    if (id === 'recurring') return user.recurringCandidatesCount;
    return 0;
  };

  const sidebarContent = (compact: boolean) => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          px: compact ? 2 : 3,
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'center' : 'flex-start',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <NotifyFinLogo compact={compact} />
        </Link>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: compact ? 1.25 : 2, py: 1 }}>
        {(['financas', 'gestao'] as const).map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section);
          return (
            <Box key={section} mb={2}>
              {!compact && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1.5,
                    pb: 0.75,
                    display: 'block',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                  }}
                >
                  {section === 'financas' ? 'Finanças' : 'Gestão & Auditoria'}
                </Typography>
              )}
              <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {items.map((item) => {
                  const active = isActive(item.href);
                  const badge = getBadgeCount(item.id);
                  return (
                    <Tooltip
                      key={item.id}
                      title={compact ? item.label : ''}
                      placement="right"
                    >
                      <ListItemButton
                        component={Link}
                        href={item.href}
                        onClick={() => setIsMobileSidebar(false)}
                        selected={active}
                        sx={{
                          borderRadius: '8px',
                          px: compact ? 1.5 : 1.75,
                          py: 1.1,
                          justifyContent: compact ? 'center' : 'flex-start',
                          color: active ? '#FFFFFF' : 'text.primary',
                          bgcolor: active ? 'primary.main' : 'transparent',
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: '#FFFFFF',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                          },
                          '&:hover': {
                            bgcolor: active
                              ? 'primary.dark'
                              : theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: compact ? 'auto' : 34,
                            color: 'inherit',
                          }}
                        >
                          <Badge
                            badgeContent={compact ? badge : 0}
                            color="warning"
                            max={99}
                          >
                            {renderNavIcon(item.iconName, 20)}
                          </Badge>
                        </ListItemIcon>
                        {!compact && (
                          <>
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{
                                fontSize: '0.875rem',
                                fontWeight: active ? 600 : 500,
                                noWrap: true,
                              }}
                            />
                            {badge > 0 && (
                              <Chip
                                label={badge}
                                size="small"
                                color={active ? 'default' : 'warning'}
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  bgcolor: active
                                    ? 'rgba(255,255,255,0.22)'
                                    : undefined,
                                  color: active ? '#FFFFFF' : undefined,
                                }}
                              />
                            )}
                          </>
                        )}
                      </ListItemButton>
                    </Tooltip>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Modernize Sidebar Profile Footer */}
      {!compact && (
        <Box sx={{ p: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor:
                activeMode === 'dark'
                  ? 'rgba(93, 135, 255, 0.14)'
                  : 'primary.light',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: 'primary.main',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {user.displayName}
              </Typography>
              <Typography variant="caption" color="textSecondary" noWrap display="block">
                Titular
              </Typography>
            </Box>
            <form action="/auth/signout" method="post">
              <Tooltip title="Sair">
                <IconButton
                  type="submit"
                  size="small"
                  color="primary"
                  aria-label="Sair"
                >
                  <IconLogout size={18} />
                </IconButton>
              </Tooltip>
            </form>
          </Paper>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        width: '100%',
        bgcolor: 'background.default',
      }}
    >
      {/* Desktop Permanent Sidebar */}
      {isDesktop ? (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            transition: theme.transitions.create('width', {
              duration: theme.transitions.duration.shorter,
            }),
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
              transition: theme.transitions.create('width', {
                duration: theme.transitions.duration.shorter,
              }),
            },
          }}
        >
          {sidebarContent(isMini)}
        </Drawer>
      ) : (
        /* Mobile Temporary Drawer */
        <Drawer
          variant="temporary"
          open={isMobileSidebar}
          onClose={() => setIsMobileSidebar(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebarContent(false)}
        </Drawer>
      )}

      {/* Main Page Wrapper */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
        }}
      >
        {/* Modernize Sticky Topbar */}
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            bgcolor:
              activeMode === 'dark'
                ? 'rgba(23, 28, 35, 0.88)'
                : 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary',
          }}
        >
          <Toolbar
            sx={{
              minHeight: { xs: 60, lg: 70 },
              px: { xs: 1.5, sm: 3 },
              gap: 1,
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Abrir menu"
              onClick={() => {
                if (isDesktop) {
                  setIsCollapse(isMini ? 'full-sidebar' : 'mini-sidebar');
                } else {
                  setIsMobileSidebar(true);
                }
              }}
            >
              <IconMenu2 size={21} />
            </IconButton>

            {!isDesktop && (
              <Box sx={{ mr: 0.5 }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <NotifyFinLogo compact />
                </Link>
              </Box>
            )}

            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                noWrap
                sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
              >
                {currentNav.label}
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* Color Palette Picker (Modernize signature) */}
              <Tooltip title="Cor do tema">
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={(e) => setPaletteAnchor(e.currentTarget)}
                  aria-label="Cor do tema"
                >
                  <IconPalette size={20} />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={paletteAnchor}
                open={Boolean(paletteAnchor)}
                onClose={() => setPaletteAnchor(null)}
              >
                {COLOR_THEMES.map((t) => (
                  <MenuItem
                    key={t.id}
                    onClick={() => {
                      setActiveTheme(t.id);
                      setPaletteAnchor(null);
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" width="100%">
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: t.color,
                        }}
                      />
                      <Typography variant="body2" flexGrow={1}>
                        {t.label}
                      </Typography>
                      {activeTheme === t.id && <IconCheck size={16} />}
                    </Stack>
                  </MenuItem>
                ))}
              </Menu>

              {/* Light / Dark Toggle */}
              <Tooltip title={activeMode === 'dark' ? 'Modo claro' : 'Modo escuro'}>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={toggleMode}
                  aria-label="Alternar modo claro/escuro"
                >
                  {activeMode === 'dark' ? (
                    <IconSun size={20} />
                  ) : (
                    <IconMoon size={20} />
                  )}
                </IconButton>
              </Tooltip>

              {/* Reviews quick badge */}
              <Tooltip title="Fila de revisão">
                <IconButton
                  component={Link}
                  href="/revisoes"
                  size="small"
                  color="inherit"
                  aria-label="Fila de revisão"
                >
                  <Badge badgeContent={user.openReviewsCount} color="warning">
                    <IconAlertCircle size={20} />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User Avatar Menu */}
              <IconButton
                size="small"
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                aria-label="Perfil"
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={() => setProfileAnchor(null)}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {user.displayName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {user.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem
                  component={Link}
                  href="/documentos"
                  onClick={() => setProfileAnchor(null)}
                >
                  Documentos Fiscais
                </MenuItem>
                <MenuItem
                  component={Link}
                  href="/sincronizacao"
                  onClick={() => setProfileAnchor(null)}
                >
                  Open Finance (Pluggy)
                </MenuItem>
                <Divider />
                <Box component="form" action="/auth/signout" method="post">
                  <MenuItem component="button" type="submit" sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" color="error.main">
                      <IconLogout size={16} />
                      <span>Sair</span>
                    </Stack>
                  </MenuItem>
                </Box>
              </Menu>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Main Content Container */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: 1320,
            mx: 'auto',
            px: { xs: 1.5, sm: 2.5, lg: 3 },
            pt: { xs: 2, sm: 3 },
            pb: { xs: 11, lg: 4 },
          }}
        >
          {children}
        </Box>

        {/* Mobile Bottom Navigation */}
        {!isDesktop && (
          <Paper
            elevation={8}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: theme.zIndex.appBar,
              borderTop: `1px solid ${theme.palette.divider}`,
              pb: 'env(safe-area-inset-bottom)',
            }}
          >
            <BottomNavigation
              showLabels
              value={
                mobileNavItems.findIndex((item) => isActive(item.href))
              }
              sx={{
                height: 62,
                bgcolor: 'background.paper',
                '& .MuiBottomNavigationAction-root': {
                  minWidth: 0,
                  px: 0.5,
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  mt: 0.25,
                },
              }}
            >
              {mobileNavItems.map((item) => {
                const badge = getBadgeCount(item.id);
                return (
                  <BottomNavigationAction
                    key={item.id}
                    component={Link}
                    href={item.href}
                    label={item.shortLabel}
                    icon={
                      <Badge badgeContent={badge} color="warning" max={99}>
                        {renderNavIcon(item.iconName, 20)}
                      </Badge>
                    }
                  />
                );
              })}
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
