// Remembers the last name used to sign a comment, shared between the full
// Comments page and the minimal feedback rail so it doesn't have to be
// retyped in either place.
export const COMMENT_NAME_KEY = 'mmm-comment-author';

export function getSavedCommentName() {
  return localStorage.getItem(COMMENT_NAME_KEY) || '';
}

export function saveCommentName(name) {
  localStorage.setItem(COMMENT_NAME_KEY, name);
}
