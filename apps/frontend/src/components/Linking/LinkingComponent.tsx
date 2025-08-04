import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  Search as SearchIcon,
  Create as CreateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useLinking } from '../../hooks/useLinking';
import { 
  BaseEntity, 
  LinkingComponentProps, 
  ENTITY_CONFIGS 
} from '../../types/linking';

export const LinkingComponent = <T extends BaseEntity>({
  sourceType,
  sourceId,
  config,
  title,
  showCreateButton = true,
  showSearch = true,
  maxHeight = '400px',
  className,
  onLinkChange,
  renderEntity,
  renderCreateForm
}: LinkingComponentProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createFormData, setCreateFormData] = useState<Partial<T>>({});

  const {
    linked,
    all,
    loading,
    creating,
    error,
    link,
    unlink,
    create,
    refresh
  } = useLinking(sourceType, sourceId, config);

  // Filter entities based on search term
  const filteredAll = all.filter(entity => {
    const displayValue = entity[config.displayField] as string;
    const descriptionValue = config.descriptionField 
      ? (entity[config.descriptionField] as string) || ''
      : '';
    
    const searchLower = searchTerm.toLowerCase();
    return displayValue.toLowerCase().includes(searchLower) ||
           descriptionValue.toLowerCase().includes(searchLower);
  });

  // Filter out already linked entities
  const availableEntities = filteredAll.filter(entity => 
    !linked.some(linkedEntity => linkedEntity.id === entity.id)
  );

  // Handle linking
  const handleLink = useCallback(async (entityId: string) => {
    await link(entityId);
    onLinkChange?.(linked);
  }, [link, linked, onLinkChange]);

  // Handle unlinking
  const handleUnlink = useCallback(async (entityId: string) => {
    await unlink(entityId);
    onLinkChange?.(linked.filter(e => e.id !== entityId));
  }, [unlink, linked, onLinkChange]);

  // Handle creating new entity
  const handleCreate = useCallback(async (data: Partial<T>) => {
    await create(data);
    setShowCreateDialog(false);
    setCreateFormData({});
    onLinkChange?.(linked);
  }, [create, linked, onLinkChange]);

  // Default entity renderer
  const defaultRenderEntity = (entity: T, isLinked: boolean) => (
    <ListItem key={entity.id} dense>
      <ListItemText
        primary={entity[config.displayField] as string}
        secondary={
          config.descriptionField 
            ? (entity[config.descriptionField] as string) || 'No description'
            : undefined
        }
      />
      <ListItemSecondaryAction>
        <Tooltip title={isLinked ? 'Unlink' : 'Link'}>
          <IconButton
            edge="end"
            onClick={() => isLinked ? handleUnlink(entity.id) : handleLink(entity.id)}
            color={isLinked ? 'error' : 'primary'}
          >
            {isLinked ? <UnlinkIcon /> : <LinkIcon />}
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );

  // Default create form renderer
  const defaultRenderCreateForm = (
    onSubmit: (data: Partial<T>) => void,
    onCancel: () => void
  ) => (
    <Box component="form" onSubmit={(e) => {
      e.preventDefault();
      onSubmit(createFormData);
    }}>
      {config.createFormFields?.map(field => (
        <TextField
          key={field.name}
          fullWidth
          margin="normal"
          label={field.label}
          value={createFormData[field.name as keyof T] || ''}
          onChange={(e) => setCreateFormData(prev => ({
            ...prev,
            [field.name]: e.target.value
          }))}
          required={field.required}
          multiline={field.type === 'textarea'}
          rows={field.type === 'textarea' ? 3 : 1}
          select={field.type === 'select'}
        >
          {field.type === 'select' && field.options?.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ))}
    </Box>
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h3">
            {title || `${config.displayName}s`}
          </Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={refresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {showCreateButton && (
              <Tooltip title={`Create ${config.displayName}`}>
                <IconButton 
                  size="small" 
                  onClick={() => setShowCreateDialog(true)}
                  color="primary"
                >
                  <CreateIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search */}
        {showSearch && (
          <TextField
            fullWidth
            size="small"
            placeholder={`Search ${config.displayName}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ mb: 2 }}
          />
        )}

        {/* Linked Entities */}
        {linked.length > 0 && (
          <>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Linked {config.displayName}s ({linked.length})
            </Typography>
            <List dense sx={{ maxHeight, overflow: 'auto', mb: 2 }}>
              {linked.map(entity => (
                <Box key={entity.id}>
                  {renderEntity ? 
                    renderEntity(entity, true) : 
                    defaultRenderEntity(entity, true)
                  }
                </Box>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Available Entities */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Available {config.displayName}s ({availableEntities.length})
        </Typography>
        <List dense sx={{ maxHeight, overflow: 'auto' }}>
          {availableEntities.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary={`No ${config.displayName}s available`}
                secondary={searchTerm ? 'Try adjusting your search' : 'All items are already linked'}
              />
            </ListItem>
          ) : (
            availableEntities.map(entity => (
              <Box key={entity.id}>
                {renderEntity ? 
                  renderEntity(entity, false) : 
                  defaultRenderEntity(entity, false)
                }
              </Box>
            ))
          )}
        </List>

        {/* Create Dialog */}
        <Dialog 
          open={showCreateDialog} 
          onClose={() => setShowCreateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Create New {config.displayName}
          </DialogTitle>
          <DialogContent>
            {renderCreateForm ? 
              renderCreateForm(handleCreate, () => setShowCreateDialog(false)) :
              defaultRenderCreateForm(handleCreate, () => setShowCreateDialog(false))
            }
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleCreate(createFormData)}
              variant="contained"
              disabled={creating}
            >
              {creating ? <CircularProgress size={20} /> : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Convenience components for common entity types
export const NoteLinkingComponent = (props: Omit<LinkingComponentProps<any>, 'config'>) => (
  <LinkingComponent {...props} config={ENTITY_CONFIGS.note} />
);

export const ProjectLinkingComponent = (props: Omit<LinkingComponentProps<any>, 'config'>) => (
  <LinkingComponent {...props} config={ENTITY_CONFIGS.project} />
);

export const ProtocolLinkingComponent = (props: Omit<LinkingComponentProps<any>, 'config'>) => (
  <LinkingComponent {...props} config={ENTITY_CONFIGS.protocol} />
);

export const RecipeLinkingComponent = (props: Omit<LinkingComponentProps<any>, 'config'>) => (
  <LinkingComponent {...props} config={ENTITY_CONFIGS.recipe} />
);

export const PDFLinkingComponent = (props: Omit<LinkingComponentProps<any>, 'config'>) => (
  <LinkingComponent {...props} config={ENTITY_CONFIGS.pdf} />
);

export const DatabaseEntryLinkingComponent = (props: Omit<LinkingComponentProps<any>, 'config'>) => (
  <LinkingComponent {...props} config={ENTITY_CONFIGS.databaseEntry} />
);

export const TaskLinkingComponent = (props: Omit<LinkingComponentProps<any>, 'config'>) => (
  <LinkingComponent {...props} config={ENTITY_CONFIGS.task} />
); 