# Analytics Page Fixes TODO

## Issues to Fix:
1. ✓ Check if friend exists in database before adding
2. ✓ Don't make up random stats - fetch real stats from Firebase
3. ✓ Fix accuracy showing 0% bug
4. ✓ Fix tournament - show loading state, proper rank/participants

## Implementation Steps:
- [x] 1. Fix accuracy 0% bug in loadAnalytics() function
- [x] 2. Add Firebase user lookup in addFriend() function
- [x] 3. Replace mock stats with real Firebase data
- [x] 4. Fix tournament - add loading state and real data from Firebase

## Summary of Changes:
1. **Accuracy Fix**: Changed from using basic history (which had no accuracy data) to using detailedHistory which stores accuracy per game session.

2. **Friend System**: 
   - Now verifies user exists in Firebase Firestore before adding
   - Shows "Searching..." loading state while checking
   - Fetches real stats (total games, best score, avg score) from leaderboard_alltime collection
   - Displays loading spinner when viewing friend profile
   - Gets detailed game-by-game scores from Firebase

3. **Tournament Fixes**:
   - Shows "..." as loading state while fetching data
   - Gets real participant count from Firebase
   - Gets user's real rank when in tournament
   - Saves user to Firebase tournament collection when joining
   - Shows "Already Joined" button state when previously joined
   - Uses week-based tournament ID for proper weekly tournaments

