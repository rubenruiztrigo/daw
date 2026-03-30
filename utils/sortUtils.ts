import { Comment, Reply } from '../types';

export const sortComments = <T extends Comment | Reply>(comments: T[]): T[] => {
  if (!comments) return [];
  
  return [...comments].sort((a, b) => {
    // 1. Most likes
    if ((b.likes || 0) !== (a.likes || 0)) {
      return (b.likes || 0) - (a.likes || 0);
    }
    
    // 2. Most replies (only applicable if the object has a replies array)
    const aReplies = a.replies?.length || 0;
    const bReplies = b.replies?.length || 0;
    if (bReplies !== aReplies) {
      return bReplies - aReplies;
    }
    
    // 3. Most recent
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
};
