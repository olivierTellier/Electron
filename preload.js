// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { dialog } = require('electron')
const fs = require('fs');
const {BrowserWindow} = require('electron')
const remote = require("electron").remote;
const shell = remote.shell;


window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  } 
  
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  let rawdata = fs.readFileSync('qcm.json');
  let qcm_Object = JSON.parse(rawdata);

  let title = document.getElementById("title")
  let question = document.getElementById("question")
  let subtitle = document.getElementById("subtitle");
  let image = document.getElementById("image");
  let questionCount = document.getElementById("question_count")
  var button = document.getElementById("action_button");
  var answers = document.getElementById("answers")
  var indexQuestion = 0;
  var userValidatedAnswers = new Array(qcm_Object.qcm.questions.length)
  var shouldShowResults = true;
  var userName = "";
  var userLastName = "";
  var userEmail = "";
  let checkboxs = null;
  setupHome();

  function setupHome(){
    title.innerHTML = "Bienvenue"
    question.innerHTML = qcm_Object.qcm.title;
    subtitle.innerHTML = qcm_Object.qcm.questions.length + " questions";
    image.setAttribute("src", "img/home.png");
    createInput();
    button.innerText = "Démarrer";
    button.addEventListener('click', 
      function() {
        if (indexQuestion == 0){
          userName = document.getElementById("Name").value;
          userLastName = document.getElementById("LastName").value;
          userEmail = document.getElementById("Email").value;
        }
        if (indexQuestion < qcm_Object.qcm.questions.length) {
          if(indexQuestion != 0) {
            checkUserAnswers();
          }
          setupQuestion();
          indexQuestion += 1;
        } else {
          if (shouldShowResults) {
            checkUserAnswers();
            shouldShowResults = !shouldShowResults;
            setupResults();
          } else {
            generatedPDF();
          }
          
        } 
      }
    );
  }

  function createInput(){
    var inputName = document.createElement("input");
    inputName.type = "text";
    inputName.id = "Name"
    inputName.placeholder = "Prénom";

    var inputLastName = document.createElement("input");
    inputLastName.type = "text";
    inputLastName.placeholder = "Nom";
    inputLastName.id = "LastName"

    var inputEmail = document.createElement("input");
    inputEmail.type = "text";
    inputEmail.placeholder = "Email";
    inputEmail.id = "Email"

    answers.appendChild(inputName);
    answers.appendChild(inputLastName);
    answers.appendChild(inputEmail);
  }

  function setupQuestion(){
    title.innerHTML = "Questionnaire";
    question.innerHTML = qcm_Object.qcm.questions[indexQuestion].title;
    subtitle.innerHTML = "";
    if(qcm_Object.qcm.questions[indexQuestion].image == "") {
      image.setAttribute("src", "");
    } else {
      image.setAttribute("src", "img/" + qcm_Object.qcm.questions[indexQuestion].image);
    }
    
    questionCount.innerText = (indexQuestion+1) + "/" + qcm_Object.qcm.questions.length; 
    button.innerText = "Suivant";
    createAnswers();
  }

  function checkUserAnswers(){
    var isValide = true;
    checkboxs = document.getElementsByClassName("answerstest")

    Array.from(checkboxs).forEach(checkbox => {
      if(checkbox.value == checkbox.checked) {
        console.log(checkbox.firstChild);
        isValide = false;
        // Doesn't work, i dont understand why...
      }
    });
    console.log(isValide);
    userValidatedAnswers[indexQuestion] = isValide;
  }

  function createAnswers() {
    while (answers.firstChild) {
      answers.removeChild(answers.firstChild);
    }
    var answerTitle = "";
    qcm_Object.qcm.questions[indexQuestion].answers.forEach(answer => {
      answerTitle = answer.title
      var label= document.createElement("label");
      var description = document.createTextNode(answerTitle);
      var checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      label.className = "answerstest"   
      checkbox.value = answer.isValide;     

      label.appendChild(checkbox);
      label.appendChild(description);   

      answers.appendChild(label);
    });
  }

  function setupResults(){
    while (answers.firstChild) {
      answers.removeChild(answers.firstChild);
    }
    title.innerHTML = "Résultats"
    question.innerHTML = "";
    subtitle.innerHTML = "";
    questionCount.innerText = "";
    button.innerText = "Certificat";

    var goodAnswers = 0;
    var imgResult = ""

    if (!userValidatedAnswers.includes(false)){
      imgResult = "gold.png"
      goodAnswers = userValidatedAnswers.length;
    } else {
      userValidatedAnswers.forEach(answer => {
        if(answer) {
          goodAnswers += 1;
        }
      });
      if(goodAnswers >= qcm_Object.qcm.questions.length/2) {
        imgResult = "silver.png";
      } else {
        imgResult = "bronze.png";
      }
    }

    var label= document.createElement("label");
    label.innerHTML = "Votre score est de : " + goodAnswers + "/" + userValidatedAnswers.length;
    answers.appendChild(label);

    image.setAttribute("src", "img/" + imgResult);
  }


  function generatedPDF(){
    console.log("PDF time, pls gimme some points");

    remote.getCurrentWindow().webContents.printToPDF({
      pageSize : 'A4',
  } , function(error , data){

          if(error){
              console.log(error);
              return;
          }

          let pdfPath = `print.pdf`;

          fs.writeFile(pdfPath, data, function (error) {
              if (error) {
                   console.log(error);
              }

              shell.openExternal("/Bureau/" +  pdfPath);
          });
  });

  }
})

