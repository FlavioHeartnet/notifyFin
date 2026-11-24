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
  IconAperture,
  IconArrowsExchange,
  IconBell,
  IconBuildingBank,
  IconCheck,
  IconFileInvoice,
  IconLogout,
  IconMenu2,
  IconMoon,
  IconPalette,
  IconPower,
  IconRefresh,
  IconRepeat,
  IconSearch,
  IconSun,
} from '@tabler/icons-react';
import { CustomizerContext } from '@/app/context/customizerContext';
import NotifyFinLogo from '@/app/components/shared/NotifyFinLogo';
import { NAV_ITEMS, type NavItem } from './nav-items';

const SIDEBAR_WIDTH = 264;
const MINI_SIDEBAR_WIDTH = 80;

const COLOR_THEMES = [
  { id: 'BLUE_THEME', label: 'Modernize Blue', color: '#5D87FF' },
  { id: 'AQUA_THEME', label: 'Aqua', color: '#0074BA' },
  { id: 'GREEN_THEME', label: 'Esmeralda', color: '#0A7EA4' },
  { id: 'PURPLE_THEME', label: 'Roxo', color: '#763EBD' },
  { id: 'ORANGE_THEME', label: 'Coral', color: '#FA896B' },
];

const HEADER_QUICK_LINKS = [
  { label: 'Extrato', href: '/movimentacoes' },
  { label: 'Contas', href: '/contas' },
  { label: 'Recorrências', href: '/recorrencias' },
  { label: 'Revisões', href: '/revisoes' },
];

function renderNavIcon(iconName: NavItem['iconName'], size = 20) {
  switch (iconName) {
    case 'dashboard':
      return <IconAperture size={size} stroke={1.65} />;
    case 'transactions':
      return <IconArrowsExchange size={size} stroke={1.65} />;
    case 'accounts':
      return <IconBuildingBank size={size} stroke={1.65} />;
    case 'recurring':
      return <IconRepeat size={size} stroke={1.65} />;
    case 'reviews':
      return <IconAlertCircle size={size} stroke={1.65} />;
    case 'documents':
      return <IconFileInvoice size={size} stroke={1.65} />;
    case 'sync':
      return <IconRefresh size={size} stroke={1.65} />;
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
  const isDark = theme.palette.mode === 'dark';
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: false,
    noSsr: false,
  });
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

  const mobileNavItems = NAV_ITEMS.filter((item) => item.mobilePrimary);

  const initials =
    user.displayName
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
      {/* Brand Header (matches Figma Sidebar Logo area) */}
      <Box
        sx={{
          px: compact ? 1.5 : 3,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'center' : 'flex-start',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <NotifyFinLogo compact={compact} size="md" />
        </Link>
      </Box>

      {/* Navigation Sections */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: compact ? 1.25 : 2, py: 1.5 }}>
        {(['financas', 'gestao'] as const).map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section);
          return (
            <Box key={section} mb={2.5}>
              {!compact && (
                <Typography
                  variant="overline"
                  sx={{
                    px: 1.5,
                    pb: 1,
                    display: 'block',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: isDark
                      ? 'rgba(255, 255, 255, 0.8)'
                      : 'rgba(42, 53, 71, 0.85)',
                    fontSize: '0.72rem',
                  }}
                >
                  {section === 'financas' ? 'Finanças' : 'Gestão & Auditoria'}
                </Typography>
              )}
              <List
                disablePadding
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
              >
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
                          px: compact ? 1.25 : 1.75,
                          py: 1.15,
                          justifyContent: compact ? 'center' : 'flex-start',
                          color: active
                            ? '#FFFFFF'
                            : isDark
                              ? 'rgba(255, 255, 255, 0.8)'
                              : 'rgba(42, 53, 71, 0.8)',
                          bgcolor: active ? 'primary.main' : 'transparent',
                          transition: 'all 0.16s ease',
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
                              : isDark
                                ? 'rgba(93, 135, 255, 0.12)'
                                : 'rgba(93, 135, 255, 0.08)',
                            color: active ? '#FFFFFF' : 'primary.main',
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
                            color="error"
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
                                fontWeight: active ? 600 : 400,
                                letterSpacing: '-0.015em',
                                noWrap: true,
                              }}
                            />
                            {badge > 0 && (
                              <Chip
                                label={badge}
                                size="small"
                                sx={{
                                  height: 20,
                                  minWidth: 22,
                                  borderRadius: '999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  bgcolor: 'secondary.main',
                                  color: '#FFFFFF',
                                  '& .MuiChip-label': { px: 0.9 },
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

      {/* Modernize Figma Sidebar Profile Footer (node 201:20653) */}
      {!compact && (
        <Box sx={{ p: 2.25 }}>
          <Box
            sx={{
              p: 1.75,
              borderRadius: '8px',
              bgcolor: 'rgba(73, 190, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.25,
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
              <Avatar
                src="/images/brand/user-avatar.png"
                alt={user.displayName}
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
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.925rem',
                    lineHeight: 1.3,
                    color: 'text.primary',
                  }}
                  noWrap
                >
                  {user.displayName.split(' ')[0]}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  display="block"
                >
                  Titular
                </Typography>
              </Box>
            </Stack>

            <form action="/auth/signout" method="post">
              <Tooltip title="Sair da conta">
                <IconButton
                  type="submit"
                  size="small"
                  aria-label="Sair"
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(93, 135, 255, 0.14)',
                    },
                  }}
                >
                  <IconPower size={20} stroke={1.75} />
                </IconButton>
              </Tooltip>
            </form>
          </Box>
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
              bgcolor: 'background.paper',
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
              bgcolor: 'background.paper',
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
          bgcolor: 'background.default',
        }}
      >
        {/* Modernize Figma Header (node 201:20654 Light / 747:13465 Dark) */}
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            bgcolor: isDark
              ? 'rgba(42, 53, 71, 0.92)'
              : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary',
          }}
        >
          <Toolbar
            sx={{
              minHeight: { xs: 60, lg: 64 },
              px: { xs: 1.5, sm: 3 },
              gap: { xs: 1, sm: 2 },
            }}
          >
            {/* Left Group: Menu toggle, Search shortcut, Quick Links */}
            <Stack direction="row" spacing={{ xs: 0.75, sm: 1.5 }} alignItems="center">
              <IconButton
                edge="start"
                color="inherit"
                aria-label="Alternar menu"
                onClick={() => {
                  if (isDesktop) {
                    setIsCollapse(isMini ? 'full-sidebar' : 'mini-sidebar');
                  } else {
                    setIsMobileSidebar(true);
                  }
                }}
              >
                <IconMenu2 size={22} stroke={1.65} />
              </IconButton>

              {!isDesktop && (
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <NotifyFinLogo compact size="sm" />
                </Link>
              )}

              <Tooltip title="Buscar movimentações">
                <IconButton
                  component={Link}
                  href="/movimentacoes"
                  color="inherit"
                  aria-label="Buscar movimentações"
                  size="small"
                >
                  <IconSearch size={20} stroke={1.65} />
                </IconButton>
              </Tooltip>

              {isDesktop && (
                <Stack direction="row" spacing={2.5} alignItems="center" sx={{ pl: 1 }}>
                  {HEADER_QUICK_LINKS.map((ql) => {
                    const active = isActive(ql.href);
                    return (
                      <Typography
                        key={ql.href}
                        component={Link}
                        href={ql.href}
                        sx={{
                          fontSize: '0.9375rem',
                          fontWeight: active ? 600 : 400,
                          letterSpacing: '-0.02em',
                          color: active
                            ? 'primary.main'
                            : isDark
                              ? 'rgba(255,255,255,0.8)'
                              : 'rgba(42,53,71,0.8)',
                          transition: 'color 0.15s ease',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        {ql.label}
                      </Typography>
                    );
                  })}
                </Stack>
              )}
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            {/* Right Group: Palette, Dark/Light, Reviews Bell, Profile Avatar */}
            <Stack direction="row" spacing={{ xs: 0.5, sm: 1.25 }} alignItems="center">
              <Tooltip title="Cor do tema">
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={(e) => setPaletteAnchor(e.currentTarget)}
                  aria-label="Cor do tema"
                >
                  <IconPalette size={20} stroke={1.65} />
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
                          width: 14,
                          height: 14,
                          borderRadius: '999px',
                          bgcolor: t.color,
                        }}
                      />
                      <Typography variant="body2" flexGrow={1} fontWeight={500}>
                        {t.label}
                      </Typography>
                      {activeTheme === t.id && (
                        <IconCheck size={16} color={theme.palette.primary.main} />
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </Menu>

              <Tooltip title={activeMode === 'dark' ? 'Modo claro' : 'Modo escuro'}>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={toggleMode}
                  aria-label="Alternar modo claro/escuro"
                >
                  {activeMode === 'dark' ? (
                    <IconSun size={20} stroke={1.65} />
                  ) : (
                    <IconMoon size={20} stroke={1.65} />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip
                title={
                  user.openReviewsCount > 0
                    ? `${user.openReviewsCount} pendência(s) na fila de revisão`
                    : 'Fila de revisão em dia'
                }
              >
                <IconButton
                  component={Link}
                  href="/revisoes"
                  size="small"
                  color="inherit"
                  aria-label="Fila de revisão"
                >
                  <Badge
                    badgeContent={user.openReviewsCount}
                    color="error"
                    invisible={user.openReviewsCount === 0}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.68rem',
                        height: 17,
                        minWidth: 17,
                        bgcolor: '#FA896B',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <IconBell size={20} stroke={1.65} />
                  </Badge>
                </IconButton>
              </Tooltip>

              <IconButton
                size="small"
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                aria-label="Menu do perfil"
                sx={{ p: 0.35 }}
              >
                <Avatar
                  src="/images/brand/user-avatar.png"
                  alt={user.displayName}
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
                PaperProps={{ sx: { minWidth: 220 } }}
              >
                <Box sx={{ px: 2, py: 1.25 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {user.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
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
            maxWidth: 1240,
            mx: 'auto',
            px: { xs: 2, sm: 3 },
            pt: { xs: 2.5, sm: 3 },
            pb: { xs: 11, lg: 5 },
          }}
        >
          {children}
        </Box>

        {/* Mobile Bottom Navigation */}
        {!isDesktop && (
          <Paper
            elevation={12}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: theme.zIndex.appBar,
              borderTop: `1px solid ${theme.palette.divider}`,
              pb: 'env(safe-area-inset-bottom)',
              bgcolor: 'background.paper',
            }}
          >
            <BottomNavigation
              showLabels
              value={mobileNavItems.findIndex((item) => isActive(item.href))}
              sx={{
                height: 62,
                bgcolor: 'background.paper',
                '& .MuiBottomNavigationAction-root': {
                  minWidth: 0,
                  px: 0.5,
                  color: 'text.secondary',
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
                      <Badge badgeContent={badge} color="error" max={99}>
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
