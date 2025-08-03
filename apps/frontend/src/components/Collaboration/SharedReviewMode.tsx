import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Button, TextField,
    List, ListItem, ListItemText, ListItemAvatar, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, Alert, IconButton, Tooltip, Divider, Paper,
    FormControl, InputLabel, Select, MenuItem, Switch,
    FormControlLabel, Accordion, AccordionSummary, AccordionDetails,
    Grid, Badge, Tabs, Tab, Comment, CommentContent, CommentActions,
    CommentAuthor, CommentMetadata, CommentGroup, Label, Input,
    TextArea, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger
} from '@mui/material';
import {
    Comment as CommentIcon, Edit as EditIcon, Check as CheckIcon,
    Close as CloseIcon, Reply as ReplyIcon, Flag as FlagIcon,
    Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon,
    Person as PersonIcon, Group as GroupIcon, Notifications as NotificationsIcon,
    ExpandMore as ExpandMoreIcon, Send as SendIcon, MoreVert as MoreVertIcon,
    ThumbUp as ThumbUpIcon, ThumbDown as ThumbDownIcon, CheckCircle as ResolveIcon,
    History as HistoryIcon, Settings as SettingsIcon, FilterList as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Comment {
    id: string;
    content: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
        role: string;
    };
    timestamp: string;
    type: 'comment' | 'suggestion' | 'question' | 'review';
    status: 'pending' | 'resolved' | 'rejected' | 'approved';
    parentId?: string;
    replies: Comment[];
    reactions: {
        thumbsUp: string[];
        thumbsDown: string[];
    };
    tags: string[];
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    visibility: 'public' | 'private' | 'team';
    mentions: string[];
    attachments?: string[];
}

interface ReviewSession {
    id: string;
    title: string;
    description: string;
    content: any;
    contentType: 'experiment' | 'protocol' | 'note' | 'project' | 'task';
    status: 'draft' | 'in_review' | 'approved' | 'rejected' | 'completed';
    createdBy: string;
    createdAt: string;
    dueDate?: string;
    reviewers: string[];
    participants: string[];
    settings: {
        allowAnonymous: boolean;
        requireApproval: boolean;
        autoResolve: boolean;
        notificationFrequency: 'immediate' | 'daily' | 'weekly';
        commentVisibility: 'all' | 'reviewers' | 'team';
    };
    comments: Comment[];
    version: number;
    lastModified: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`review-tabpanel-${index}`}
            aria-labelledby={`review-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const SharedReviewMode: React.FC<{ content: any; contentType: string }> = ({ content, contentType }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentType, setCommentType] = useState<'comment' | 'suggestion' | 'question' | 'review'>('comment');
    const [commentPriority, setCommentPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [commentVisibility, setCommentVisibility] = useState<'public' | 'private' | 'team'>('public');
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [showResolved, setShowResolved] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mock current user
    const currentUser = {
        id: '1',
        name: 'Dr. Sarah Johnson',
        avatar: '/avatars/sarah.jpg',
        role: 'Principal Investigator'
    };

    useEffect(() => {
        initializeReviewSession();
        loadComments();
    }, [content]);

    const initializeReviewSession = () => {
        const session: ReviewSession = {
            id: `review-${Date.now()}`,
            title: `Review: ${content.name || content.title}`,
            description: `Review session for ${contentType}`,
            content,
            contentType: contentType as any,
            status: 'in_review',
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            reviewers: ['2', '3', '4'], // Mock reviewer IDs
            participants: ['1', '2', '3', '4'],
            settings: {
                allowAnonymous: false,
                requireApproval: true,
                autoResolve: false,
                notificationFrequency: 'immediate',
                commentVisibility: 'all'
            },
            comments: [],
            version: 1,
            lastModified: new Date().toISOString()
        };
        setReviewSession(session);
    };

    const loadComments = async () => {
        setLoading(true);
        try {
            // Mock comments - in real app, this would be an API call
            const mockComments: Comment[] = [
                {
                    id: '1',
                    content: 'This protocol looks good overall, but I suggest adding a step for quality control.',
                    author: {
                        id: '2',
                        name: 'Dr. Michael Chen',
                        avatar: '/avatars/michael.jpg',
                        role: 'Senior Researcher'
                    },
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    type: 'suggestion',
                    status: 'pending',
                    replies: [],
                    reactions: { thumbsUp: ['1'], thumbsDown: [] },
                    tags: ['protocol', 'quality-control'],
                    isResolved: false,
                    priority: 'medium',
                    visibility: 'public',
                    mentions: []
                },
                {
                    id: '2',
                    content: 'What concentration of the primary antibody should be used?',
                    author: {
                        id: '3',
                        name: 'Dr. Emily Rodriguez',
                        avatar: '/avatars/emily.jpg',
                        role: 'Postdoc'
                    },
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                    type: 'question',
                    status: 'pending',
                    replies: [
                        {
                            id: '2-1',
                            content: 'We typically use 1:1000 dilution for this antibody.',
                            author: currentUser,
                            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                            type: 'comment',
                            status: 'pending',
                            replies: [],
                            reactions: { thumbsUp: ['2', '3'], thumbsDown: [] },
                            tags: ['antibody', 'concentration'],
                            isResolved: false,
                            priority: 'low',
                            visibility: 'public',
                            mentions: ['3']
                        }
                    ],
                    reactions: { thumbsUp: ['1', '4'], thumbsDown: [] },
                    tags: ['antibody', 'concentration'],
                    isResolved: false,
                    priority: 'high',
                    visibility: 'public',
                    mentions: []
                },
                {
                    id: '3',
                    content: 'This experiment design is excellent and follows best practices.',
                    author: {
                        id: '4',
                        name: 'Dr. David Kim',
                        avatar: '/avatars/david.jpg',
                        role: 'Reviewer'
                    },
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                    type: 'review',
                    status: 'approved',
                    replies: [],
                    reactions: { thumbsUp: ['1', '2', '3'], thumbsDown: [] },
                    tags: ['approval', 'design'],
                    isResolved: true,
                    resolvedBy: '1',
                    resolvedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                    priority: 'low',
                    visibility: 'public',
                    mentions: []
                }
            ];
            setComments(mockComments);
        } catch (error) {
            setError('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const addComment = async () => {
        if (!newComment.trim()) return;

        const comment: Comment = {
            id: `comment-${Date.now()}`,
            content: newComment,
            author: currentUser,
            timestamp: new Date().toISOString(),
            type: commentType,
            status: 'pending',
            parentId: replyTo || undefined,
            replies: [],
            reactions: { thumbsUp: [], thumbsDown: [] },
            tags: [],
            isResolved: false,
            priority: commentPriority,
            visibility: commentVisibility,
            mentions: extractMentions(newComment)
        };

        try {
            // In real app, this would be an API call
            setComments(prev => [...prev, comment]);
            setNewComment('');
            setReplyTo(null);
            setCommentType('comment');
            setCommentPriority('medium');
            setCommentVisibility('public');
        } catch (error) {
            setError('Failed to add comment');
        }
    };

    const extractMentions = (text: string): string[] => {
        const mentionRegex = /@(\w+)/g;
        const mentions: string[] = [];
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(match[1]);
        }
        return mentions;
    };

    const resolveComment = async (commentId: string) => {
        try {
            setComments(prev => prev.map(comment =>
                comment.id === commentId
                    ? { ...comment, isResolved: true, resolvedBy: currentUser.id, resolvedAt: new Date().toISOString() }
                    : comment
            ));
        } catch (error) {
            setError('Failed to resolve comment');
        }
    };

    const addReaction = async (commentId: string, reactionType: 'thumbsUp' | 'thumbsDown') => {
        try {
            setComments(prev => prev.map(comment => {
                if (comment.id === commentId) {
                    const reactions = { ...comment.reactions };
                    const userId = currentUser.id;

                    if (reactions[reactionType].includes(userId)) {
                        reactions[reactionType] = reactions[reactionType].filter(id => id !== userId);
                    } else {
                        reactions[reactionType] = [...reactions[reactionType], userId];
                        // Remove from other reaction type
                        const otherType = reactionType === 'thumbsUp' ? 'thumbsDown' : 'thumbsUp';
                        reactions[otherType] = reactions[otherType].filter(id => id !== userId);
                    }

                    return { ...comment, reactions };
                }
                return comment;
            }));
        } catch (error) {
            setError('Failed to add reaction');
        }
    };

    const filteredComments = comments.filter(comment => {
        if (!showResolved && comment.isResolved) return false;
        if (filterType !== 'all' && comment.type !== filterType) return false;
        if (filterPriority !== 'all' && comment.priority !== filterPriority) return false;
        if (filterStatus !== 'all' && comment.status !== filterStatus) return false;
        return true;
    });

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'success',
            medium: 'warning',
            high: 'error',
            critical: 'error'
        };
        return colors[priority as keyof typeof colors] || 'default';
    };

    const getTypeIcon = (type: string) => {
        const icons = {
            comment: <CommentIcon />,
            suggestion: <EditIcon />,
            question: <CommentIcon />,
            review: <CheckIcon />
        };
        return icons[type as keyof typeof icons] || <CommentIcon />;
    };

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'warning',
            resolved: 'success',
            rejected: 'error',
            approved: 'success'
        };
        return colors[status as keyof typeof colors] || 'default';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Shared Review Mode
            </Typography>

            {reviewSession && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box>
                                <Typography variant="h6">{reviewSession.title}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {reviewSession.description}
                                </Typography>
                            </Box>
                            <Box display="flex" gap={1}>
                                <Chip
                                    label={reviewSession.status.replace('_', ' ')}
                                    color={getStatusColor(reviewSession.status) as any}
                                />
                                <Chip label={`v${reviewSession.version}`} variant="outlined" />
                            </Box>
                        </Box>

                        <Box display="flex" gap={2} alignItems="center">
                            <Typography variant="body2">
                                <strong>Reviewers:</strong> {reviewSession.reviewers.length} assigned
                            </Typography>
                            <Typography variant="body2">
                                <strong>Due:</strong> {format(new Date(reviewSession.dueDate!), 'MMM dd, yyyy')}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Comments:</strong> {comments.length} total
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Comments" />
                    <Tab label="Suggestions" />
                    <Tab label="Review Summary" />
                </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        {/* Comment Input */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" gap={2} mb={2}>
                                    <FormControl size="small">
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            value={commentType}
                                            onChange={(e) => setCommentType(e.target.value as any)}
                                        >
                                            <MenuItem value="comment">Comment</MenuItem>
                                            <MenuItem value="suggestion">Suggestion</MenuItem>
                                            <MenuItem value="question">Question</MenuItem>
                                            <MenuItem value="review">Review</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small">
                                        <InputLabel>Priority</InputLabel>
                                        <Select
                                            value={commentPriority}
                                            onChange={(e) => setCommentPriority(e.target.value as any)}
                                        >
                                            <MenuItem value="low">Low</MenuItem>
                                            <MenuItem value="medium">Medium</MenuItem>
                                            <MenuItem value="high">High</MenuItem>
                                            <MenuItem value="critical">Critical</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small">
                                        <InputLabel>Visibility</InputLabel>
                                        <Select
                                            value={commentVisibility}
                                            onChange={(e) => setCommentVisibility(e.target.value as any)}
                                        >
                                            <MenuItem value="public">Public</MenuItem>
                                            <MenuItem value="private">Private</MenuItem>
                                            <MenuItem value="team">Team</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Add a comment, suggestion, or question..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    sx={{ mb: 2 }}
                                />

                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box display="flex" gap={1}>
                                        {commentPriority !== 'low' && (
                                            <Chip
                                                label={commentPriority}
                                                color={getPriorityColor(commentPriority) as any}
                                                size="small"
                                            />
                                        )}
                                        {commentVisibility !== 'public' && (
                                            <Chip
                                                label={commentVisibility}
                                                variant="outlined"
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                    <Button
                                        variant="contained"
                                        onClick={addComment}
                                        disabled={!newComment.trim()}
                                        startIcon={<SendIcon />}
                                    >
                                        Add Comment
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Filters */}
                        <Box display="flex" gap={2} mb={2} alignItems="center">
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showResolved}
                                        onChange={(e) => setShowResolved(e.target.checked)}
                                    />
                                }
                                label="Show Resolved"
                            />

                            <FormControl size="small">
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <MenuItem value="all">All Types</MenuItem>
                                    <MenuItem value="comment">Comments</MenuItem>
                                    <MenuItem value="suggestion">Suggestions</MenuItem>
                                    <MenuItem value="question">Questions</MenuItem>
                                    <MenuItem value="review">Reviews</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small">
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                >
                                    <MenuItem value="all">All Priorities</MenuItem>
                                    <MenuItem value="low">Low</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="critical">Critical</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <MenuItem value="all">All Status</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="resolved">Resolved</MenuItem>
                                    <MenuItem value="rejected">Rejected</MenuItem>
                                    <MenuItem value="approved">Approved</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Comments List */}
                        {loading ? (
                            <Box display="flex" justifyContent="center" p={3}>
                                <Typography>Loading comments...</Typography>
                            </Box>
                        ) : filteredComments.length > 0 ? (
                            <List>
                                {filteredComments.map((comment) => (
                                    <ListItem key={comment.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <Card sx={{ width: '100%', mb: 2 }}>
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar src={comment.author.avatar}>
                                                            {comment.author.name.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle2">
                                                                {comment.author.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {comment.author.role} • {format(new Date(comment.timestamp), 'MMM dd, yyyy HH:mm')}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box display="flex" gap={1}>
                                                        {getTypeIcon(comment.type)}
                                                        <Chip
                                                            label={comment.type}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        <Chip
                                                            label={comment.priority}
                                                            color={getPriorityColor(comment.priority) as any}
                                                            size="small"
                                                        />
                                                        {comment.isResolved && (
                                                            <Chip
                                                                label="Resolved"
                                                                color="success"
                                                                size="small"
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>

                                                <Typography variant="body1" sx={{ mb: 2 }}>
                                                    {comment.content}
                                                </Typography>

                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Box display="flex" gap={1}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => addReaction(comment.id, 'thumbsUp')}
                                                            color={comment.reactions.thumbsUp.includes(currentUser.id) ? 'primary' : 'default'}
                                                        >
                                                            <ThumbUpIcon fontSize="small" />
                                                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                                                                {comment.reactions.thumbsUp.length}
                                                            </Typography>
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => addReaction(comment.id, 'thumbsDown')}
                                                            color={comment.reactions.thumbsDown.includes(currentUser.id) ? 'primary' : 'default'}
                                                        >
                                                            <ThumbDownIcon fontSize="small" />
                                                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                                                                {comment.reactions.thumbsDown.length}
                                                            </Typography>
                                                        </IconButton>
                                                        <Button
                                                            size="small"
                                                            startIcon={<ReplyIcon />}
                                                            onClick={() => setReplyTo(comment.id)}
                                                        >
                                                            Reply
                                                        </Button>
                                                    </Box>

                                                    {!comment.isResolved && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<ResolveIcon />}
                                                            onClick={() => resolveComment(comment.id)}
                                                        >
                                                            Resolve
                                                        </Button>
                                                    )}
                                                </Box>

                                                {/* Replies */}
                                                {comment.replies.length > 0 && (
                                                    <Box sx={{ ml: 4, mt: 2 }}>
                                                        {comment.replies.map((reply) => (
                                                            <Card key={reply.id} variant="outlined" sx={{ mb: 1 }}>
                                                                <CardContent sx={{ py: 1 }}>
                                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                                        <Avatar src={reply.author.avatar} sx={{ width: 24, height: 24 }}>
                                                                            {reply.author.name.charAt(0)}
                                                                        </Avatar>
                                                                        <Typography variant="subtitle2">
                                                                            {reply.author.name}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {format(new Date(reply.timestamp), 'MMM dd, yyyy HH:mm')}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography variant="body2">
                                                                        {reply.content}
                                                                    </Typography>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="info">
                                No comments found matching the current filters.
                            </Alert>
                        )}
                    </Grid>

                    <Grid item xs={12} md={4}>
                        {/* Review Summary */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Review Summary
                                </Typography>

                                <Box display="flex" flexDirection="column" gap={2}>
                                    <Box>
                                        <Typography variant="subtitle2">Total Comments</Typography>
                                        <Typography variant="h4">{comments.length}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2">Resolved</Typography>
                                        <Typography variant="h6" color="success.main">
                                            {comments.filter(c => c.isResolved).length}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2">Pending</Typography>
                                        <Typography variant="h6" color="warning.main">
                                            {comments.filter(c => !c.isResolved).length}
                                        </Typography>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            By Type
                                        </Typography>
                                        {['comment', 'suggestion', 'question', 'review'].map(type => {
                                            const count = comments.filter(c => c.type === type).length;
                                            return count > 0 ? (
                                                <Box key={type} display="flex" justifyContent="space-between" mb={1}>
                                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                        {type}s
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {count}
                                                    </Typography>
                                                </Box>
                                            ) : null;
                                        })}
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            By Priority
                                        </Typography>
                                        {['critical', 'high', 'medium', 'low'].map(priority => {
                                            const count = comments.filter(c => c.priority === priority).length;
                                            return count > 0 ? (
                                                <Box key={priority} display="flex" justifyContent="space-between" mb={1}>
                                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                        {priority}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {count}
                                                    </Typography>
                                                </Box>
                                            ) : null;
                                        })}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
                <Typography variant="h6" gutterBottom>
                    Suggestions & Changes
                </Typography>
                <Alert severity="info">
                    Suggestions feature coming soon. This will allow users to propose specific changes to content.
                </Alert>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
                <Typography variant="h6" gutterBottom>
                    Review Summary
                </Typography>
                <Alert severity="info">
                    Review summary and analytics coming soon.
                </Alert>
            </TabPanel>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default SharedReviewMode; 