import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  TableChart as TableChartIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface AnalyticsChartProps {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'table' | 'progress' | 'metric';
  data: any;
  config?: {
    color?: string;
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    animate?: boolean;
  };
  onRefresh?: () => void;
  onExport?: () => void;
  onFullscreen?: () => void;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title,
  type,
  data,
  config = {},
  onRefresh,
  onExport,
  onFullscreen,
}) => {
  const {
    color = 'primary',
    height = 300,
    showLegend = true,
    showGrid = true,
    animate = true,
  } = config;

  const renderChart = () => {
    switch (type) {
      case 'metric':
        return (
          <Box textAlign="center" py={4}>
            <Typography variant="h3" color={color} gutterBottom>
              {data.value || '0'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {data.label || 'Metric'}
            </Typography>
            {data.trend && (
              <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                {data.trend > 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={data.trend > 0 ? 'success.main' : 'error.main'}
                  ml={0.5}
                >
                  {Math.abs(data.trend)}%
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 'progress':
        return (
          <Box py={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{data.label || 'Progress'}</Typography>
              <Typography variant="h6" color={color}>
                {data.value || 0}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={data.value || 0}
              sx={{ height: 8, borderRadius: 4 }}
              color={color as any}
            />
            {data.target && (
              <Typography variant="body2" color="textSecondary" mt={1}>
                Target: {data.target}%
              </Typography>
            )}
          </Box>
        );

      case 'table':
        return (
          <Box py={2}>
            {data.rows?.map((row: any, index: number) => (
              <Box
                key={index}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                py={1}
                borderBottom={index < data.rows.length - 1 ? '1px solid' : 'none'}
                borderColor="divider"
              >
                <Typography variant="body2">{row.label}</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {row.value && (
                    <Typography variant="body2" fontWeight="medium">
                      {row.value}
                    </Typography>
                  )}
                  {row.chip && (
                    <Chip
                      label={row.chip.label}
                      color={row.chip.color}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        );

      default:
        return (
          <Box
            height={height}
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px dashed"
            borderColor="divider"
            borderRadius={1}
          >
            <Box textAlign="center">
              {type === 'line' && <LineChartIcon fontSize="large" color="disabled" />}
              {type === 'bar' && <BarChartIcon fontSize="large" color="disabled" />}
              {type === 'pie' && <PieChartIcon fontSize="large" color="disabled" />}
              <Typography variant="body2" color="textSecondary" mt={1}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Chart
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Chart library integration required
              </Typography>
            </Box>
          </Box>
        );
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{title}</Typography>
          <Box display="flex" gap={0.5}>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={onRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            {onExport && (
              <Tooltip title="Export">
                <IconButton size="small" onClick={onExport}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            {onFullscreen && (
              <Tooltip title="Fullscreen">
                <IconButton size="small" onClick={onFullscreen}>
                  <FullscreenIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart; 