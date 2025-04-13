
const video = document.getElementById('webcam');
const canvas = document.getElementById('output-canvas');
const ctx = canvas.getContext('2d');
const statusElement = document.getElementById('status');
const webcamContainer = document.getElementById('webcam-container');


const config = {
    width: 640,
    height: 480,
    backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3'],
    currentColorIndex: 0,
    handLiftedTimeout: null
};


async function setupCamera() {
    canvas.width = config.width;
    canvas.height = config.height;

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            width: config.width,
            height: config.height,
            facingMode: 'user'
        }
    });
    
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}


async function loadHandPoseModel() {
    statusElement.textContent = 'Loading hand detection model...';
    
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
        runtime: 'mediapipe',
        maxHands: 2,
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
    };
    
    const detector = await handPoseDetection.createDetector(model, detectorConfig);
    statusElement.textContent = 'Model loaded! Lift your hand to change background color.';
    
    return detector;
}


function isHandLifted(hand) {
    if (!hand || !hand.keypoints) return false;
    
 
    
    const wrist = hand.keypoints[0];
    const indexTip = hand.keypoints[8];
    const middleTip = hand.keypoints[12];
    const ringTip = hand.keypoints[16];
    const pinkyTip = hand.keypoints[20];
    
   
    const fingersUp = 
        indexTip && (wrist.y - indexTip.y > 70) &&
        middleTip && (wrist.y - middleTip.y > 70) &&
        ringTip && (wrist.y - ringTip.y > 70) &&
        pinkyTip && (wrist.y - pinkyTip.y > 70);
        
    return fingersUp;
}

function changeBackgroundColor() {
    config.currentColorIndex = (config.currentColorIndex + 1) % config.backgroundColor.length;
    webcamContainer.style.backgroundColor = config.backgroundColor[config.currentColorIndex];
}

function drawHand(hand) {
    if (!hand || !hand.keypoints) return;
    
    
    ctx.fillStyle = 'aqua';
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    
    for (const keypoint of hand.keypoints) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],       
        [0, 5], [5, 6], [6, 7], [7, 8],         
        [0, 9], [9, 10], [10, 11], [11, 12],    
        [0, 13], [13, 14], [14, 15], [15, 16],  
        [0, 17], [17, 18], [18, 19], [19, 20],  
        [5, 9], [9, 13], [13, 17]               
    ];
    

    for (const [i, j] of connections) {
        const kp1 = hand.keypoints[i];
        const kp2 = hand.keypoints[j];
        
        if (kp1 && kp2) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
        }
    }
}


let lastHandLiftedState = false;

async function detectHands(detector) {
    if (!detector) return;
    
   
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
   
    const hands = await detector.estimateHands(video, { flipHorizontal: true });
    
    if (hands && hands.length > 0) {
       
        hands.forEach(hand => drawHand(hand));
        
     
        const handLifted = hands.some(hand => isHandLifted(hand));
        
      
        if (handLifted && !lastHandLiftedState) {
            changeBackgroundColor();
            statusElement.textContent = `Background changed to ${config.backgroundColor[config.currentColorIndex]}`;
        }
        
        lastHandLiftedState = handLifted;
    } else {
        lastHandLiftedState = false;
    }
    

    requestAnimationFrame(() => detectHands(detector));
}


async function init() {
    try {
        await setupCamera();
        const detector = await loadHandPoseModel();
        detectHands(detector);
    } catch (error) {
        statusElement.textContent = `Error: ${error.message}`;
        console.error('Error initializing:', error);
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
