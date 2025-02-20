// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes, listAll } from "firebase/storage";
import * as Firestore from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCFmLzaIgRzm_Gu35ilA3IIhcAifprKplY",
    authDomain: "bim-webapp.firebaseapp.com",
    projectId: "bim-webapp",
    storageBucket: "bim-webapp.firebasestorage.app",
    messagingSenderId: "443452484329",
    appId: "1:443452484329:web:7666ebfecf3c185a771e78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

export const firebaseDB = getFirestore()

export function getCollection<T>(path: string) {
    return Firestore.collection(firebaseDB, path) as Firestore.CollectionReference<T>
}

//Function for deleting a project in the projects database
export async function deleteDocument(path: string, id: string) {
    const doc = Firestore.doc(firebaseDB, `${path}/${id}`)
    await Firestore.deleteDoc(doc)
}

//Function for updating the project in the projects database
export async function updateDocument<T extends Record<string, any>>(path: string, id: string, data: T) {
    const doc = Firestore.doc(firebaseDB, `${path}/${id}`)
    await Firestore.updateDoc(doc, data)
}

//Function for uploading the BIM Models
export async function uploadFile(filePath: string, file: Blob) {
    try {
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file).then((snapshot) => {
        });
    }
    catch (error) {
        console.error("An error occurred:", error);
    }
}

//Function for downloading the BIM Models
export async function downloadFile(filePath: string) {
    const storageRef = ref(storage, filePath);
    try {
        const url = await getDownloadURL(storageRef);
        const response = await fetch(url);
        return await response.arrayBuffer();
    }

    catch (error) {
        console.error("Error downloading file:", error);
        return null;

    }
}

//Function for deleting BIM Files
export async function deleteFile(filePath: string) {
    const storageRef = ref(storage, filePath);
    try {
        await deleteObject(storageRef)

    }

    catch (error) {
        console.error("Error delting file:", error);
        return null;

    }
}

//Function for deleting entire folders


export async function deleteFolderRecursive(folderPath: string) {
    const folderRef = ref(storage, folderPath);
  
    try {
      // List all files and subfolders inside the folder
      const res = await listAll(folderRef);
  
      // Delete all files inside the folder
      const deleteFilePromises = res.items.map((fileRef) => deleteObject(fileRef));
  
      // Recursively delete all subfolders
      const deleteFolderPromises = res.prefixes.map((subFolderRef) =>
        deleteFolderRecursive(subFolderRef.fullPath)
      );
  
      // Execute all deletions in parallel
      await Promise.all([...deleteFilePromises, ...deleteFolderPromises]);
  
      console.log(`Folder "${folderPath}" and all its contents have been deleted.`);
    } catch (error) {
      console.error("Error deleting the folder:", error);
    }
  }