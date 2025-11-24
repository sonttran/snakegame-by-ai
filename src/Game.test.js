import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SnakeGame, GRID_SIZE, STEP } from './Game.js';
import * as THREE from 'three';

// Mock SoundManager
vi.mock('./SoundManager.js', () => {
    return {
        SoundManager: vi.fn(function () {
            this.playEatNormal = vi.fn();
            this.playEatSpecial = vi.fn();
        })
    };
});

// Mock three-spritetext
vi.mock('three-spritetext', () => {
    return {
        default: vi.fn(function () {
            this.position = { set: vi.fn() };
            this.color = '';
            this.text = '';
        })
    };
});

// Mock THREE.js
vi.mock('three', () => {
    const Scene = vi.fn(function () {
        this.add = vi.fn();
        this.remove = vi.fn();
        this.background = null;
        this.fog = null;
    });

    const Vector3 = vi.fn(function (x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.set = vi.fn(function (nx, ny, nz) { this.x = nx; this.y = ny; this.z = nz; });
        this.copy = vi.fn(function (v) { this.x = v.x; this.y = v.y; this.z = v.z; });
    });

    const Group = vi.fn(function () {
        this.add = vi.fn();
        this.position = { set: vi.fn(), x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.lookAt = vi.fn();
        this.userData = {};
    });

    const Mesh = vi.fn(function () {
        this.position = { set: vi.fn(), x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = { set: vi.fn() };
        this.castShadow = false;
        this.receiveShadow = false;
        this.lookAt = vi.fn();
        this.userData = {};
        this.material = { color: { setHex: vi.fn() }, emissive: { setHex: vi.fn() } };
    });

    const PointLight = vi.fn(function () {
        this.position = { set: vi.fn() };
    });

    return {
        Scene,
        Vector3,
        Group,
        Mesh,
        PointLight,
        BoxGeometry: vi.fn(function () { this.center = vi.fn(); }),
        SphereGeometry: vi.fn(function () { this.center = vi.fn(); }),
        PlaneGeometry: vi.fn(function () { this.center = vi.fn(); }),
        ConeGeometry: vi.fn(function () { this.center = vi.fn(); }),
        ExtrudeGeometry: vi.fn(function () { this.center = vi.fn(); }),
        Shape: vi.fn(function () {
            this.moveTo = vi.fn();
            this.bezierCurveTo = vi.fn();
        }),
        MeshStandardMaterial: vi.fn(),
        Color: vi.fn(),
        Fog: vi.fn(),
        PerspectiveCamera: vi.fn(),
        WebGLRenderer: vi.fn(),
        AmbientLight: vi.fn(),
        DirectionalLight: vi.fn(),
        GridHelper: vi.fn(),
    };
});

describe('SnakeGame', () => {
    let game;
    let scene;
    let uiCallbacks;

    beforeEach(() => {
        scene = new THREE.Scene();
        uiCallbacks = {
            onScoreUpdate: vi.fn(),
            onGameOver: vi.fn(),
            onSpecialTimer: vi.fn(),
        };
        game = new SnakeGame(scene, uiCallbacks);
    });

    it('should initialize with default state', () => {
        expect(game.score).toBe(0);
        expect(game.isPlaying).toBe(false);
        expect(game.isGameOver).toBe(false);
    });

    it('should start the game correctly', () => {
        game.start();
        expect(game.isPlaying).toBe(true);
        expect(game.score).toBe(0);
        expect(game.snake.length).toBe(2); // 2 body parts
        expect(game.dragonHead).toBeDefined();
        expect(game.normalFood).toBeDefined();
        expect(scene.add).toHaveBeenCalled();
    });

    it('should move the snake forward', () => {
        game.start();
        const initialHeadX = game.dragonHead.position.x;
        const initialHeadZ = game.dragonHead.position.z;

        // Default direction is (1, 0, 0)
        game.update();

        expect(game.dragonHead.position.set).toHaveBeenCalledWith(
            initialHeadX + STEP, 0, initialHeadZ
        );
    });

    it('should handle input to change direction', () => {
        game.start();
        game.handleInput('ArrowDown');
        game.update();

        expect(game.direction.z).toBe(1);
        expect(game.direction.x).toBe(0);
    });

    it('should wrap around walls', () => {
        game.start();
        const limit = GRID_SIZE / 2;
        game.dragonHead.position.x = limit - 1;
        game.direction.set(1, 0, 0);

        game.update();

        expect(game.dragonHead.position.set).toHaveBeenCalledWith(-limit, 0, 0);
    });

    it('should eat normal food, play sound, and increase score', () => {
        game.start();
        const headX = game.dragonHead.position.x;
        const headZ = game.dragonHead.position.z;
        const targetX = headX + 1;
        const targetZ = headZ;

        game.normalFood.position.x = targetX;
        game.normalFood.position.z = targetZ;

        game.update();

        expect(game.score).toBe(10);
        expect(uiCallbacks.onScoreUpdate).toHaveBeenCalledWith(10);
        expect(game.soundManager.playEatNormal).toHaveBeenCalled();
        expect(game.snake.length).toBe(3);
    });

    it('should eat special food, play sound, and get double score', () => {
        game.start();

        // Manually spawn special food
        game.spawnSpecialFood();

        const headX = game.dragonHead.position.x;
        const headZ = game.dragonHead.position.z;
        const targetX = headX + 1;
        const targetZ = headZ;

        game.specialFood.position.x = targetX;
        game.specialFood.position.z = targetZ;

        game.update();

        expect(game.score).toBe(20); // 20 points for special
        expect(game.soundManager.playEatSpecial).toHaveBeenCalled();
    });

    it('should trigger game over on self collision', () => {
        game.start();

        const bodyPart = new THREE.Mesh();
        bodyPart.position.x = 1;
        bodyPart.position.z = 0;
        game.snake.push(bodyPart);

        game.update();

        expect(game.isGameOver).toBe(true);
        expect(uiCallbacks.onGameOver).toHaveBeenCalled();
    });
});
