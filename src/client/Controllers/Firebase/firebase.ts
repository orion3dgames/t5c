import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, updateProfile} from "firebase/auth"
import { getDatabase } from "firebase/database"

const firebaseConfig = require("./config.json");
const app = initializeApp(firebaseConfig)

const auth = getAuth(app)
const database = getDatabase(app)

let firebaseController = {

  async loginAnonymously (username = "") {
    try {
        if(username!==""){
          let authUser = await signInAnonymously(auth);
          return await updateProfile(authUser.user, {
            displayName: username,
          }).then(() => {
            return authUser;
          }).catch((error) => {
      
          });
        }else{
          return await signInAnonymously(auth);
        }

    } catch (error) {
      console.error(error);
    }
  },

}

export { auth, database, firebaseController }