async function setupCamera() {
    const video = document.getElementById('webcam');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(video);
    });
}

async function loadHandModel() {
   
    console.log("Hand model loaded");
}

function playMedia(gesture) {
    const audioPlayer = document.getElementById('song-player');
    const imageDisplay = document.getElementById('display-image');

    switch(gesture) {
        case 'thumbs_up':
            imageDisplay.src = 'happy.png';
            audioPlayer.src = 'celebration.mp3';
            break;
        case 'victory':
            imageDisplay.src = 'victory.png';
            audioPlayer.src = 'winning.mp3';
            break;
    }
    
    imageDisplay.style.display = 'block';
    audioPlayer.play();
}

async function main() {
    await setupCamera();
    await loadHandModel();


    setInterval(() => {

        const detectedGesture = 'thumbs_up';
        playMedia(detectedGesture);
    }, 1000); 
}

main();