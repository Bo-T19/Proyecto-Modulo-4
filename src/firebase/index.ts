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

//Getting the download URL of a file

export async function getURL(filePath: string) {
    const storageRef = ref(storage, filePath);
    return getDownloadURL(storageRef)
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

//Function for deleting files containing a text in its name (Useful for the tiler files)
export async function deleteFilesContainingText(folderPath: string, searchText: string) {
    try {
        const storage = getStorage();
        const folderRef = ref(storage, folderPath);

        // List all files inside the specified folder
        const result = await listAll(folderRef);
        const matchingFiles = result.items.filter(item => item.name.includes(searchText));

        // Delete each matching file
        for (const fileRef of matchingFiles) {
            await deleteObject(fileRef);
            console.log("Deleted file "+fileRef)
        }

        console.log(`Deleted ${matchingFiles.length} files containing "${searchText}"`);
    } catch (error) {
        console.error("Error deleting files:", error);
    }
}


//IndexedDB

// Function to open an IndexedDB database
export function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("BIMTiles", 1);

        // Create the object store if it doesn't exist
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains("files")) {
                db.createObjectStore("files", { keyPath: "name" });
            }
        };

        // Resolve the promise when the database is successfully opened
        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        // Reject the promise if there's an error
        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
}

// Function to store a file in IndexedDB
export async function storeFileInDB(name: string, data: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("files", "readwrite");
        const store = transaction.objectStore("files");
        const request = store.put({ name, data });

        // Resolve the promise when the file is successfully stored
        request.onsuccess = () => resolve();

        // Reject the promise if there's an error
        request.onerror = () => reject(request.error);
    });
}


export async function downloadFilesContainingText(folderPath: string, searchText: string) {
    try {
      const storage = getStorage();
      const folderRef = ref(storage, folderPath);
  
      // List all files inside the specified folder
      const result = await listAll(folderRef);
      const matchingFiles = result.items.filter(item => item.name.includes(searchText));
  
      // Download all matching files in parallel
      const downloadPromises = matchingFiles.map(async (fileRef) => {
        const url = await getDownloadURL(fileRef);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download ${fileRef.name}`);
        const blob = await response.blob();
        return { name: fileRef.name, data: blob };
      });
  
      const downloadedFiles = await Promise.all(downloadPromises);
  
      // Store files in IndexedDB
      for (const file of downloadedFiles) {
        await storeFileInDB(file.name, file.data);
      }
  
      console.log(`Downloaded and stored ${downloadedFiles.length} files containing "${searchText}"`);
      return downloadedFiles; // Return the downloaded files
    } catch (error) {
      console.error("Error downloading files:", error);
      throw error; // Re-throw the error for further handling
    }
  }