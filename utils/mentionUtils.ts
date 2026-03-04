import { User } from '../types';
import { normalizeString } from './stringUtils';

/**
 * Standardized Regex for Mentions:
 * Must start at the beginning of a line or after a space.
 * Followed by @ and alphanumeric characters, dots, or Spanish accents.
 */
export const MENTION_REGEX = /(?:^|\s)@([\w.áéíóúÁÉÍÓÚñÑ]+)/g;

/**
 * Standardized Regex for Hashtags:
 * Starts with # followed by alphanumeric characters including Spanish accents.
 */
export const HASHTAG_REGEX = /#[\wáéíóúÁÉÍÓÚñÑ]+/g;

/**
 * Combined Regex for splitting content into renderable parts.
 * Includes Mentions, Hashtags and URLs.
 */
export const RENDER_REGEX = /(#[\wáéíóúÁÉÍÓÚñÑ]+|@[\w.áéíóúÁÉÍÓÚñÑ]+|https?:\/\/[^\s]+)/g;

/**
 * Helper to sort users based on relevance to a search query.
 * Prioritizes username matches (Starts with > Includes), then name/lastname starts.
 */
export const sortUsersByRelevance = (users: User[], query: string): User[] => {
    if (!users || !Array.isArray(users)) return [];
    const normalizedQuery = normalizeString(query);
    if (!normalizedQuery) return users;

    return [...users].sort((a, b) => {
        const aUsername = normalizeString(a.username || '');
        const bUsername = normalizeString(b.username || '');
        const aName = normalizeString(a.name || '');
        const aLastName = normalizeString(a.lastName || '');
        const bName = normalizeString(b.name || '');
        const bLastName = normalizeString(b.lastName || '');

        // 1. Prioritize Username Starts With
        const aUsernameStarts = aUsername.startsWith(normalizedQuery);
        const bUsernameStarts = bUsername.startsWith(normalizedQuery);
        if (aUsernameStarts && !bUsernameStarts) return -1;
        if (!aUsernameStarts && bUsernameStarts) return 1;

        // 2. Prioritize Name/LastName Starts With
        const aNameStarts = aName.startsWith(normalizedQuery) || aLastName.startsWith(normalizedQuery);
        const bNameStarts = bName.startsWith(normalizedQuery) || bLastName.startsWith(normalizedQuery);
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;

        // 3. Prioritize Username Includes
        const aUsernameIncludes = aUsername.includes(normalizedQuery);
        const bUsernameIncludes = bUsername.includes(normalizedQuery);
        if (aUsernameIncludes && !bUsernameIncludes) return -1;
        if (!aUsernameIncludes && bUsernameIncludes) return 1;

        // 4. Prioritize Name/LastName Includes
        const aNameIncludes = aName.includes(normalizedQuery) || aLastName.includes(normalizedQuery);
        const bNameIncludes = bName.includes(normalizedQuery) || bLastName.includes(normalizedQuery);
        if (aNameIncludes && !bNameIncludes) return -1;
        if (!aNameIncludes && bNameIncludes) return 1;

        return 0;
    });
};

/**
 * Helper to filter users based on a mention query.
 */
export const getMentionSuggestions = (query: string, users: User[]): User[] => {
    if (!users || !Array.isArray(users)) return [];
    const normalizedQuery = normalizeString(query);

    const filtered = users.filter(u => {
        if (!u) return false;
        const nameMatch = normalizeString(u.name || '').includes(normalizedQuery);
        const lastNameMatch = normalizeString(u.lastName || '').includes(normalizedQuery);
        const usernameMatch = normalizeString(u.username || '').includes(normalizedQuery);
        return nameMatch || lastNameMatch || usernameMatch;
    });

    return sortUsersByRelevance(filtered, query).slice(0, 5);
};

/**
 * Helper to get user from a mention part (e.g. "@username")
 */
export const getUserByMention = (part: string, users: User[]): User | undefined => {
    // Basic validation
    const trimmed = part.trim();
    if (!trimmed.startsWith('@')) return undefined;

    // Extract potential username
    let username = trimmed.slice(1).toLowerCase();

    // strip common trailing punctuation that might be caught if regex is too greedy
    const punctuation = /[.,!?;:]+$/;

    // First try exact match
    let user = users.find(u => u.username?.toLowerCase() === username);
    if (user) return user;

    // Try stripping punctuation if it fails
    if (punctuation.test(username)) {
        username = username.replace(punctuation, '');
        user = users.find(u => u.username?.toLowerCase() === username);
    }

    return user;
};
export const getMentionedUsernames = (text: string): string[] => {
    const matches = text.match(MENTION_REGEX);
    if (!matches) return [];

    return [...new Set(matches.map(m => {
        const cleaned = m.trim().replace(/^@/, '');
        // Remove trailing punctuation that is unlikely to be part of a username
        return cleaned.replace(/[.!?,;:]+$/, '');
    }))];
};
