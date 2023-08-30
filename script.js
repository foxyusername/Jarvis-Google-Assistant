import {GOOGLE_KEY, SUMMARIZE_KEY} from "./config.js"


let bars=document.querySelector('.bars');
let circle1=document.getElementById("border-circle");
let statusDiv=document.getElementById('status');
let textDiv=document.getElementById('textDiv');
let main_div=document.getElementById('main_div');
let button;
let returnToVoice=document.getElementById('returnBtn');

let response="Jarvis is here to assist you";
let recognition;
let description=[];

   //getting user to another page to configure the microphone
setTimeout(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
    .catch(function() {
        chrome.tabs.create({
            url: chrome.runtime.getURL("./popup/getUserMedia.js"),
            selected: true
        })
    });
}, 100);


//recognizes the text
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window || 'speechSynthesis' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = true;
    
    recognition.onstart = () => {
        console.log('Processing...');
    };

    recognition.onaudioprocess = (event) => {
        console.log('audio proccesing');
    };

    recognition.onresult = event => {
        const result = event.results[event.results.length - 1][0].transcript;
        translateTranscription(result);
    };

    recognition.start();

} else {
    alert('Speech recognition is not supported.');
}

if(returnToVoice){
    returnToVoice.addEventListener('click',()=>{
       textDiv.style.display="none";
       main_div.style.display="flex";
       recognition.start();
    })
   }

function voiceStart(){
    bars.style.display="block";
 
    //creating the button of stop speaking

    statusDiv.removeChild(statusDiv.firstChild);
    const newButton=document.createElement('button');
    newButton.innerText="Stop Speaking"
    newButton.id='button';
    statusDiv.appendChild(newButton);

    //creatin button of text format
    const textFormat=document.createElement('button');
    textFormat.innerText='Text Format';
    textFormat.id='textFormat';
    statusDiv.appendChild(textFormat);


    button=document.getElementById('button');

    button.addEventListener('click',()=>{
        window.speechSynthesis.cancel();
        voiceEnd();
        recognition.start();
    });

    textFormat.addEventListener('click',()=>{
        window.speechSynthesis.cancel();
        textDiv.style.display="flex";
        main_div.style.display="none";
        voiceEnd();
        recognition.stop();
    })

    circle1.classList.remove('circle1-none');
    circle1.classList.add('circle1');
}

function voiceEnd(){
    bars.style.display="none";

    statusDiv.removeChild(statusDiv.firstChild);
    statusDiv.removeChild(statusDiv.lastChild);
    const newText=document.createElement('p');
    newText.innerText="Jarvis is listening";
    newText.id='status';
    statusDiv.appendChild(newText);


    circle1.classList.remove('circle1');
    circle1.classList.add('circle1-none');
}

async function summarizeData(text) {
    const apiKey =SUMMARIZE_KEY;
    const apiUrl = 'https://api.meaningcloud.com/summarization-1.0';
  
    const formdata = new FormData();
    formdata.append('key', apiKey);
    formdata.append('txt', text);
    formdata.append('sentences', '30');
  
    const requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow',
    };
  
    try {
      const response = await fetch(apiUrl, requestOptions);
      const data = await response.json();
      const speech= new SpeechSynthesisUtterance(data.summary);

    const voices = window.speechSynthesis.getVoices();
    speech.voice = voices[1];
    speech.rate =0.8;
    speech.pitch = 0.8;

    speechSynthesis.speak(speech);

    speech.onstart = () => {
        console.log("Speech has started.");
        voiceStart();
        recognition.stop();
    };
    
      speech.onend = () => {
        voiceEnd();
        recognition.start();
        console.log("Speech has ended.");
      };
      
      // Output the API response
    } catch (error) {
      alert('error', error);
    }
  }

function fetchData(url){
 
description=[];

fetch('https://www.googleapis.com/customsearch/v1?q='+url+'&key='+GOOGLE_KEY+'&cx=6691bf2ff8ae5494a')
  .then(response => response.json())
  .then(data => {

  const header=document.createElement('h1');
    header.innerText=url

   textDiv.appendChild(header);


    // Extract search results from data.items
    const searchResults = data.items;
    // Display the search results on your page
    searchResults.forEach((result,index) => {

    const section=document.createElement('section');    
    const p=document.createElement('p');
    p.innerText=""+[index+1]+" . "+result.snippet;
    const a=document.createElement('a');
    a.href=result.link;
    a.innerText=result.link;
    textDiv.appendChild(section);
    section.appendChild(p);
    section.appendChild(a);

    description.push(result.snippet);
    });

  }).then((data)=>{                  //sendign request to summarize the text
   const joinedText =description.map((text,index)=>" . answer number"+[index+1]+" : "+text+"").join(' ');
   summarizeData(description.join(' '));
})
  .catch(error => {
    console.error('An error occurred:', error);
   alert('something went wrong. Please repeat again or check if Google still support Jarvis');
  });

}




//makes text turn into a voice
function translateTranscription(command) {

fetchData(command.trim());

}