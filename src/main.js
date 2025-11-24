import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SnakeGame, TICK_RATE } from './Game.js';

// --- State ---
let scene, camera, renderer, controls;
let game;
let lastMoveTime = 0;
let animationId;

// --- UI Elements ---
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const gameOverEl = document.getElementById('game-over');
const startScreenEl = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// --- Initialization ---
function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202025);
  scene.fog = new THREE.Fog(0x202025, 10, 50);

  // Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 15);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.querySelector('#app').appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(22, 22); // GRID_SIZE + 2
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x353540,
    roughness: 0.8,
    metalness: 0.2
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid Helper
  const gridHelper = new THREE.GridHelper(20, 20, 0x555566, 0x333344);
  scene.add(gridHelper);

  // Game Instance
  game = new SnakeGame(scene, {
    onScoreUpdate: (score) => {
      scoreEl.innerText = score;
    },
    onGameOver: (score) => {
      finalScoreEl.innerText = score;
      gameOverEl.classList.remove('hidden');
    },
    onSpecialTimer: (timeLeft) => {
      const timerEl = document.getElementById('special-timer');
      const timerVal = document.getElementById('timer-val');
      if (timeLeft > 0) {
        timerEl.classList.remove('hidden');
        timerVal.innerText = timeLeft.toFixed(1);
      } else {
        timerEl.classList.add('hidden');
      }
    }
  });

  // Event Listeners
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', (e) => game.handleInput(e.key));
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  // Initial Render
  renderer.render(scene, camera);
}

function startGame() {
  if (animationId) cancelAnimationFrame(animationId);

  // Hide UI
  startScreenEl.classList.add('hidden');
  gameOverEl.classList.add('hidden');

  game.start();

  // Start Loop
  lastMoveTime = performance.now();
  animate(lastMoveTime);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
  if (!game.isPlaying) return;
  animationId = requestAnimationFrame(animate);

  // Game Loop Logic
  if (time - lastMoveTime > 150) { // TICK_RATE hardcoded or imported
    game.update();
    lastMoveTime = time;
  }

  // Animations (Food bobbing)
  if (game.normalFood) {
    game.normalFood.userData.time += 0.05;
    game.normalFood.position.y = Math.abs(Math.sin(game.normalFood.userData.time)) * 0.5;
    game.normalFood.rotation.y += 0.02;
  }

  if (game.specialFood) {
    game.specialFood.userData.time += 0.05;
    game.specialFood.position.y = Math.abs(Math.sin(game.specialFood.userData.time)) * 0.5;
    game.specialFood.rotation.y += 0.02;
  }

  controls.update();
  renderer.render(scene, camera);
}

init();
