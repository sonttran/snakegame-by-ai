import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { SoundManager } from './SoundManager.js';

export const GRID_SIZE = 20;
export const STEP = 1;
export const TICK_RATE = 150; // ms per move

export class SnakeGame {
    constructor(scene, uiCallbacks) {
        this.scene = scene;
        this.uiCallbacks = uiCallbacks; // { onScoreUpdate, onGameOver, onSpecialTimer }
        this.soundManager = new SoundManager();

        this.snake = [];
        this.dragonHead = null;
        this.normalFood = null;
        this.specialFood = null;

        this.direction = new THREE.Vector3(1, 0, 0);
        this.nextDirection = new THREE.Vector3(1, 0, 0);

        this.score = 0;
        this.isGameOver = false;
        this.isPlaying = false;
    }

    start() {
        // Reset State
        this.snake.forEach(part => this.scene.remove(part));
        this.snake = [];
        if (this.dragonHead) this.scene.remove(this.dragonHead);
        if (this.normalFood) this.scene.remove(this.normalFood);
        if (this.specialFood) this.scene.remove(this.specialFood);
        this.normalFood = null;
        this.specialFood = null;

        this.direction.set(1, 0, 0);
        this.nextDirection.set(1, 0, 0);
        this.score = 0;
        this.isGameOver = false;
        this.isPlaying = true;

        if (this.uiCallbacks.onScoreUpdate) this.uiCallbacks.onScoreUpdate(this.score);

        // Create Dragon Head
        this.dragonHead = this.createDragonHead();
        this.dragonHead.position.set(0, 0, 0);
        this.dragonHead.rotation.y = Math.PI / 2;
        this.scene.add(this.dragonHead);

        // Create Initial Body
        this.createBodyPart(-1, 0);
        this.createBodyPart(-2, 0);

        // Create Food
        this.spawnNormalFood();
    }

    createDragonHead() {
        const group = new THREE.Group();

        // Main Head
        const headGeo = new THREE.BoxGeometry(0.9, 0.9, 1.0);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x00aa55, roughness: 0.3 });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.castShadow = true;
        group.add(headMesh);

        // Snout
        const snoutGeo = new THREE.BoxGeometry(0.7, 0.6, 0.5);
        const snoutMat = new THREE.MeshStandardMaterial({ color: 0x008844, roughness: 0.3 });
        const snoutMesh = new THREE.Mesh(snoutGeo, snoutMat);
        snoutMesh.position.set(0, -0.1, 0.6);
        snoutMesh.castShadow = true;
        group.add(snoutMesh);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.5 });

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(0.3, 0.2, 0.4);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(-0.3, 0.2, 0.4);
        group.add(rightEye);

        // Horns
        const hornGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });

        const leftHorn = new THREE.Mesh(hornGeo, hornMat);
        leftHorn.position.set(0.3, 0.6, -0.2);
        leftHorn.rotation.x = -0.2;
        group.add(leftHorn);

        const rightHorn = new THREE.Mesh(hornGeo, hornMat);
        rightHorn.position.set(-0.3, 0.6, -0.2);
        rightHorn.rotation.x = -0.2;
        group.add(rightHorn);

        return group;
    }

    createBodyPart(x, z) {
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00cc66,
            roughness: 0.4,
            metalness: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 0, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.snake.push(mesh);
    }

    getValidPosition() {
        let x, z;
        let validPosition = false;
        let attempts = 0;
        while (!validPosition && attempts < 100) {
            attempts++;
            x = Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2;
            z = Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2;

            validPosition = true;
            // Check snake
            for (const part of this.snake) {
                if (Math.abs(part.position.x - x) < 0.1 && Math.abs(part.position.z - z) < 0.1) {
                    validPosition = false;
                    break;
                }
            }
            // Check head
            if (this.dragonHead && Math.abs(this.dragonHead.position.x - x) < 0.1 && Math.abs(this.dragonHead.position.z - z) < 0.1) {
                validPosition = false;
            }
            // Check normal food
            if (this.normalFood && Math.abs(this.normalFood.position.x - x) < 0.1 && Math.abs(this.normalFood.position.z - z) < 0.1) {
                validPosition = false;
            }
            // Check special food
            if (this.specialFood && Math.abs(this.specialFood.position.x - x) < 0.1 && Math.abs(this.specialFood.position.z - z) < 0.1) {
                validPosition = false;
            }
        }
        if (!validPosition) { x = 0; z = 0; }
        return { x, z };
    }

    spawnNormalFood() {
        if (this.normalFood) this.scene.remove(this.normalFood);

        const { x, z } = this.getValidPosition();

        this.normalFood = new THREE.Group();
        this.normalFood.position.set(x, 0, z);

        const geometry = new THREE.SphereGeometry(0.4, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff3366,
            emissive: 0xaa1133,
            emissiveIntensity: 0.5,
            roughness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        this.normalFood.add(mesh);

        const foodLight = new THREE.PointLight(0xff3366, 1.5, 5);
        foodLight.position.set(0, 0.5, 0);
        this.normalFood.add(foodLight);

        this.normalFood.userData = { time: 0 };
        this.scene.add(this.normalFood);
    }

    spawnSpecialFood() {
        if (this.specialFood) return;

        const { x, z } = this.getValidPosition();

        this.specialFood = new THREE.Group();
        this.specialFood.position.set(x, 0, z);

        const heartShape = new THREE.Shape();
        heartShape.moveTo(0.25, 0.25);
        heartShape.bezierCurveTo(0.25, 0.25, 0.20, 0, 0, 0);
        heartShape.bezierCurveTo(-0.30, 0, -0.30, 0.35, -0.30, 0.35);
        heartShape.bezierCurveTo(-0.30, 0.55, -0.10, 0.77, 0.25, 0.95);
        heartShape.bezierCurveTo(0.60, 0.77, 0.80, 0.55, 0.80, 0.35);
        heartShape.bezierCurveTo(0.80, 0.35, 0.80, 0, 0.50, 0);
        heartShape.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);

        const geometry = new THREE.ExtrudeGeometry(heartShape, {
            depth: 0.2, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.05, bevelThickness: 0.05
        });
        geometry.center();

        const material = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.6,
            roughness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(1.2, 1.2, 1.2); // 2x larger than previous 0.6
        mesh.rotation.x = Math.PI;
        mesh.castShadow = true;
        this.specialFood.add(mesh);

        const foodLight = new THREE.PointLight(0xffaa00, 1.5, 5);
        foodLight.position.set(0, 0.5, 0);
        this.specialFood.add(foodLight);

        // 3D Text Timer
        const timerText = new SpriteText('5.0', 1);
        timerText.color = 'white';
        timerText.position.set(0, 1.5, 0); // Above the heart
        this.specialFood.add(timerText);
        this.specialFood.userData.timerText = timerText;

        this.specialFood.userData = { time: 0, spawnTime: Date.now(), timerText: timerText };
        this.scene.add(this.specialFood);
    }

    handleInput(key) {
        if (!this.isPlaying) return;

        switch (key) {
            case 'ArrowUp':
                if (this.direction.z !== 1) this.nextDirection.set(0, 0, -1);
                break;
            case 'ArrowDown':
                if (this.direction.z !== -1) this.nextDirection.set(0, 0, 1);
                break;
            case 'ArrowLeft':
                if (this.direction.x !== 1) this.nextDirection.set(-1, 0, 0);
                break;
            case 'ArrowRight':
                if (this.direction.x !== -1) this.nextDirection.set(1, 0, 0);
                break;
        }
    }

    update() {
        if (!this.isPlaying) return;

        this.direction.copy(this.nextDirection);

        const currentX = this.dragonHead.position.x;
        const currentZ = this.dragonHead.position.z;

        let newX = currentX + this.direction.x * STEP;
        let newZ = currentZ + this.direction.z * STEP;

        // Wall Wrapping
        const limit = GRID_SIZE / 2;
        if (newX >= limit) newX = -limit;
        else if (newX < -limit) newX = limit - 1;

        if (newZ >= limit) newZ = -limit;
        else if (newZ < -limit) newZ = limit - 1;

        // Self Collision
        for (const part of this.snake) {
            if (Math.abs(part.position.x - newX) < 0.1 && Math.abs(part.position.z - newZ) < 0.1) {
                this.gameOver();
                return;
            }
        }

        // Random Special Food Spawn (approx 2% chance per tick)
        if (!this.specialFood && Math.random() < 0.02) {
            this.spawnSpecialFood();
        }

        // Special Food Expiry & Timer Update
        if (this.specialFood) {
            const elapsed = Date.now() - this.specialFood.userData.spawnTime;
            const timeLeft = Math.max(0, (5000 - elapsed) / 1000);

            if (this.uiCallbacks.onSpecialTimer) this.uiCallbacks.onSpecialTimer(timeLeft);

            // Update 3D Text
            if (this.specialFood.userData.timerText) {
                this.specialFood.userData.timerText.text = timeLeft.toFixed(1);
            }

            if (elapsed > 5000) {
                this.scene.remove(this.specialFood);
                this.specialFood = null;
                if (this.uiCallbacks.onSpecialTimer) this.uiCallbacks.onSpecialTimer(0);
            }
        }

        // Collisions
        let ateFood = false;

        // Normal Food
        if (this.normalFood && Math.abs(this.normalFood.position.x - newX) < 0.1 && Math.abs(this.normalFood.position.z - newZ) < 0.1) {
            ateFood = true;
            this.score += 10;
            this.soundManager.playEatNormal();
            if (this.uiCallbacks.onScoreUpdate) this.uiCallbacks.onScoreUpdate(this.score);
            this.spawnNormalFood();
        }

        // Special Food
        if (this.specialFood && Math.abs(this.specialFood.position.x - newX) < 0.1 && Math.abs(this.specialFood.position.z - newZ) < 0.1) {
            ateFood = true;
            this.score += 20; // Double score
            this.soundManager.playEatSpecial();
            if (this.uiCallbacks.onScoreUpdate) this.uiCallbacks.onScoreUpdate(this.score);
            this.scene.remove(this.specialFood);
            this.specialFood = null;
            if (this.uiCallbacks.onSpecialTimer) this.uiCallbacks.onSpecialTimer(0);
        }

        // Move Logic
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00cc66, roughness: 0.4 });
        const newBody = new THREE.Mesh(bodyGeo, bodyMat);
        newBody.position.set(currentX, 0, currentZ);
        newBody.castShadow = true;
        newBody.receiveShadow = true;
        this.scene.add(newBody);
        this.snake.unshift(newBody);

        if (!ateFood) {
            const tail = this.snake.pop();
            this.scene.remove(tail);
        }

        this.dragonHead.position.set(newX, 0, newZ);
        this.dragonHead.lookAt(this.dragonHead.position.x + this.direction.x, 0, this.dragonHead.position.z + this.direction.z);
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;
        if (this.uiCallbacks.onGameOver) this.uiCallbacks.onGameOver(this.score);
    }
}
