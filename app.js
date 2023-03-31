class Note {
  constructor(id, title, text){
    this.id = id;
    this.title = title;
    this.text = text;
  }
}

class App {
  constructor() {
    this.notes = [];
    this.userId = "";
    this.selectedNoteId = "";

    this.$placeholder = document.querySelector("#placeholder");
    this.$form = document.querySelector("#form");
    this.$notes = document.querySelector("#notes");
    this.$noteTitle = document.querySelector("#note-title");
    this.$noteText = document.querySelector("#note-text");
    this.$modalTitle = document.querySelector(".modal-title");
    this.$modalText = document.querySelector(".modal-text");
    this.$formButtons = document.querySelector("#form-buttons");
    this.$formCloseButton = document.querySelector("#form-close-button");
    this.$modal = document.querySelector(".modal");
    this.$modalContent = document.querySelector(".modal-content");
    this.$modalCloseButton = document.querySelector(".modal-close-button");

    this.$app = document.querySelector("#app");
    this.$firebaseAuthContainer = document.querySelector("#firebaseui-auth-container");
    this.authuserText = document.querySelector(".auth-user");
    this.$logoutButton = document.querySelector(".logout");

    
    // Initialize the FirebaseUI Widget using Firebase.
    this.ui = new firebaseui.auth.AuthUI(auth);
    this.handleAuth();

   
    this.addEventListeners();
  }

  handleAuth(){
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
                  this.userId  = user.uid;
                  this.authuserText.innerHTML = user.displayName;
                  this.redirectToApp();
      } else {
                  this.redirectToAuth();
      }
    });

  }

  redirectToApp(){

    this.$firebaseAuthContainer.style.display = "none";
    this.$app.style.display = "block";
    this.fetchNotesFormDB();

  }

  redirectToAuth(){
    
    
    this.$firebaseAuthContainer.style.display = "block";
    this.$app.style.display = "none";

    this.ui.start('#firebaseui-auth-container', {
        callbacks: {
          signInSuccessWithAuthResult: (authResult, redirectUrl) =>{

            
             this.userId = authResult.user.uid;
             this.$authUserText.innerHTML = user.displayName;
             this.redirectToApp();

             }
          },
          signInOptions: [
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
          ],
      // Other config options...
    });   

  }

  addEventListeners() {
    document.body.addEventListener("click", event => {
      this.handleFormClick(event);
      this.openModal(event);
    });

    this.$form.addEventListener("submit", event => {
      event.preventDefault();
      const title = this.$noteTitle.value;
      const text = this.$noteText.value;
      const hasNote = title || text;
      if (hasNote) {
        // add note
        this.addNote({title, text });
      }
    });

    this.$formCloseButton.addEventListener("click", event => {
      event.stopPropagation();
      this.closeForm();
    });

    this.$modalCloseButton.addEventListener("click", event=>{
      this.closeModal(event);
    })

    this.$logoutButton.addEventListener("click", (event) => {
       this.handleLogout();
    });
  }

  handleLogout(){
    firebase.auth().signOut().then(() => {
      // Sign-out successful.
      this.redirectToAuth();
    }).catch((error) => {
      // An error happened.
      console.log("ERROR OCCURED",error)
    });
  }

  handleFormClick(event) {
    const isFormClicked = this.$form.contains(event.target);

    const title = this.$noteTitle.value;
    const text = this.$noteText.value;
    const hasNote = title || text;

    if (isFormClicked) {
      this.openForm();
    } else if (hasNote) {
      this.addNote({title, text });
    } else {
      this.closeForm();
    }
  }

  openForm() {
    this.$form.classList.add("form-open");
    this.$noteTitle.style.display = "block";
    this.$formButtons.style.display = "block";
  }

  closeForm() {
    this.$form.classList.remove("form-open");
    this.$noteTitle.style.display = "none";
    this.$formButtons.style.display = "none";
    this.$noteTitle.value = "";
    this.$noteText.value = "";
  }

  
  
  openModal(event) {
    const $selectedNote = event.target.closest('.note');
    
     if ($selectedNote){
      this.$modal.classList.add('open-modal');  
      this.$modalTitle.value =$selectedNote.children[0].innerHTML;
      this.$modalText.value = $selectedNote.children[1].innerHTML;
      this.$selectedNoteId = $selectedNote.children[2].innerHTML;

     }
  }

  closeModal(event){
    const isModalFormClicked = this.$modalText.contains(event.target);


    const title = this.$modalTitle.value;
    const text = this.$modalText.value;
    const id = this.$selectedNoteId;
   

    if(!isModalFormClicked && this.$modal.classList.contains("open-modal")){
      this.editNote({id: id, title: title, text: text });
      this.$modal.classList.remove('open-modal');
    }
  }

  addNote({title, text }) {

    if(text != ""){
      const newNote = {id: cuid(), title, text};
      this.notes = [...this.notes, newNote];
      
      this.render();
    }
      this.closeForm();

  }

  editNote({id,title,text}){

    this.notes = this.notes.map((note)=>{

      if(note.id == id){
        note.title = title;
        note.text = text;
      }
        return note;
    });
    
      this.render();
  }

  render() {
    this.saveNotes();
    this.displayNotes();
  }

  fetchNotesFormDB() {

    //fetching noted from Database

    var docRef = db.collection("users").doc(this.userId);

    docRef.get().then((doc) => {
        if (doc.exists) {
            console.log("Document data:", doc.data().notes);
            this.notes = doc.data().notes;
            this.displayNotes();
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");

            db.collection("users").doc(this.userId).set({
              notes:[]
            })
            .then(() => {
                console.log("User successfully created!");
            })
            .catch((error) => {
                console.error("Error creating user: ", error);
            });
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
  }

  saveNotes(){
    //Add a new note in collection "users"
      db.collection("users").doc(this.userId).set({
          notes:this.notes
      })
      .then(() => {
          console.log("Document successfully written!");
      })
      .catch((error) => {
          console.error("Error writing document: ", error);
      });
  }

  displayNotes() {
    const hasNotes = this.notes.length > 0;      
    this.$placeholder.style.display = hasNotes ? "none" : "flex";

    this.$notes.innerHTML = this.notes
      .map(
        note => `
        <div style="background: ${note.color};" class="note">
          <div class="${note.title && "note-title"}">${note.title}</div>
          <div class="note-text">${note.text}</div>
          <div class="note-id" hidden>${note.id}</div>
          <div class="toolbar-container">
            <div class="toolbar">
            <img class="toolbar-color" src="https://cdn.iconscout.com/icon/premium/png-256-thumb/dots-vertical-2872172-2388327.png">
            <img class="toolbar-color" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi9NccUFcscIm3xUyu4lSk1eeg0f_0qJZe3g&usqp=CAU"> 
            <img class="toolbar-color" src="data:image/png;base64,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">
              <img class="toolbar-color" src="http://cdn.onlinewebfonts.com/svg/img_468944.png">
              <img class="toolbar-color" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpee3CyhN2QBYAjPfipwPaYYEZ7zJK7VpPQJXrh0AZISVoAEvoTgrg&usqp=CAU">
              <img class="toolbar-delete" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzW4c6Ed5QSsxDhvOKqv1AtgIw-m76a9LrJMGuB7aoNQ&s">
            </div>
          </div>
        </div>
     `
      )
      .join("");
  }
}

new App();