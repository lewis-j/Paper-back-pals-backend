interface FirebaseUser {
  firebase_id: string;
  username: string;
  profilePic: string;
  email: string;
  email_verified: boolean;
  sign_in_provider: string;
}
export default FirebaseUser;
