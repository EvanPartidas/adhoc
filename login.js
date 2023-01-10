const loginForm = document.querySelector("#loginForm");
//nst auth = firebase.auth();
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = loginForm['email'].value;
    const password = loginForm['password'].value;
    
    auth.signInWithEmailAndPassword(email,password).then((cred)=>{
        console.log(cred);
    });
});

auth.onAuthStateChanged((user)=>{
    if(user){
        window.location.href="/editprojects.html"
    }
});