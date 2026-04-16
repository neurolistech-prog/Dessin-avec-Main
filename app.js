const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const ctx = canvasElement.getContext('2d');
const drawCanvas = document.getElementById('drawing_canvas');
const dctx = drawCanvas.getContext('2d');

let currentColor = "#00f2ff";
let isDrawing = false;
let lastX = 0, lastY = 0;

// Gestion des couleurs
document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.onclick = () => {
        document.querySelector('.color-swatch.active').classList.remove('active');
        swatch.classList.add('active');
        currentColor = swatch.dataset.color;
    };
});

document.getElementById('clear-btn').onclick = () => {
    dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
};

function onResults(results) {
    // Redimensionnement auto
    if (drawCanvas.width !== window.innerWidth) {
        drawCanvas.width = canvasElement.width = window.innerWidth;
        drawCanvas.height = canvasElement.height = window.innerHeight;
    }

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvasElement.width, 0);
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    ctx.restore();

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];

            // Coordonnées écran (inversées car miroir)
            const x = (1 - indexTip.x) * canvasElement.width;
            const y = indexTip.y * canvasElement.height;
            const tx = (1 - thumbTip.x) * canvasElement.width;
            const ty = thumbTip.y * canvasElement.height;

            const distance = Math.hypot(x - tx, y - ty);

            // GESTE : Si distance pouce/index < 40px => DESSIN
            if (distance < 40) {
                document.getElementById('current-mode').innerText = "DESSIN";
                if (!isDrawing) {
                    isDrawing = true;
                    lastX = x; lastY = y;
                }
                
                dctx.beginPath();
                dctx.strokeStyle = currentColor;
                dctx.lineWidth = 10;
                dctx.lineCap = "round";
                dctx.moveTo(lastX, lastY);
                dctx.lineTo(x, y);
                dctx.stroke();
                
                lastX = x; lastY = y;
            } else {
                isDrawing = false;
                document.getElementById('current-mode').innerText = "NAVIGATION";
            }

            // Petit curseur visuel sur l'index
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.strokeStyle = currentColor;
            ctx.stroke();
        }
    }
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.8 });
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: 1280, height: 720
});
camera.start();
