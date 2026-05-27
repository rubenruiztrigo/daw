import { Comment, CommentReply } from '../types';

export const sortComments = <T extends Comment | CommentReply>(comments: T[]): T[] => {
  if (!comments) return [];
  return [...comments].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
