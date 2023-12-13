window.seed = 1;
window.Math.random = function () {
    const x = Math.sin(window.seed++) * 10000;
    return x - Math.floor(x);
};

let ASSETS_LOADED = new Map();
const SPAWN_INFO = [
    {
        key: "male_knight",
        quantity: 25,
        items: [{ key: "sword_01" }, { key: "helm_01" }],
        animations: ["1H_Melee_Attack_Slice_Diagonal", "Death_A", "Idle", "Walking_A"],
        bones: {
            WEAPON: 12,
            OFF_HAND: 7,
            HEAD: 14,
        },
        rotationFix: Math.PI,
        scale: 1,
    },
    {
        key: "male_knight",
        quantity: 25,
        items: [{ key: "shield_01" }, { key: "sword_01" }, { key: "helm_01" }],
        animations: ["1H_Melee_Attack_Slice_Diagonal", "Death_A", "Idle", "Walking_A"],
        bones: {
            WEAPON: 12,
            OFF_HAND: 7,
            HEAD: 14,
        },
        rotationFix: Math.PI,
        scale: 1,
    },
    {
        key: "male_mage",
        quantity: 50,
        items: [{ key: "helm_01" }, { key: "shield_01" }, { key: "sword_01" }],
        animations: ["1H_Melee_Attack_Slice_Diagonal", "Death_A", "Idle", "Walking_A"],
        bones: {
            WEAPON: 12,
            OFF_HAND: 7,
            HEAD: 14,
        },
        rotationFix: Math.PI,
        scale: 1,
    },
    {
        key: "male_rogue",
        quantity: 50,
        items: [{ key: "helm_01" }, { key: "shield_01" }, { key: "sword_01" }],
        animations: ["1H_Melee_Attack_Slice_Diagonal", "Death_A", "Idle", "Walking_A"],
        bones: {
            WEAPON: 12,
            OFF_HAND: 7,
            HEAD: 14,
        },
        rotationFix: Math.PI,
        scale: 1,
    },
    {
        key: "rat_01",
        quantity: 50,
        items: [],
        animations: ["Rat_Attack", "Rat_Death", "Rat_Idle", "Rat_Walk"],
        bones: {},
        rotationFix: Math.PI,
        scale: 0.3,
    },
];

const ITEM_DATA = {
    sword_01: {
        key: "sword_01",
        equippable: {
            slot: "WEAPON",
            rotation_y: Math.PI * 1.5,
            /*
            offset_x: 0,
            offset_y: 0,
            offset_z: 0,
            */
        },
    },
    shield_01: {
        key: "shield_01",
        equippable: {
            slot: "OFF_HAND",
            rotation_y: Math.PI * 1.5,
            scale: 1.4,
            /*
            offset_x: 0,
            offset_y: 0,
            offset_z: 0,
            rotation_x: Math.PI / 2,
            scale: 1.4,
            */
        },
    },
    helm_01: {
        key: "helm_01",
        equippable: {
            slot: "HEAD",
            rotation_y: Math.PI * 1.5,
            offset_x: 0,
            offset_y: 0.575,
            offset_z: 0.055,
            /*
            scale: 1,*/
        },
    },
};
const PLANE_SIZE = 20;
let SELECTED_ENTITY = false;
let ENTITY_DATA = new Map();
let INPUT_DATA = {
    left_click: false,
    player_can_move: false,
    x: 0,
    y: 0,
    angle: 0,
    camY: 0,
    vertical: 0,
    horizontal: 0,
    middle_click: false,
    movementX: 0,
    movementY: 0,
    digit1: false,
};
let PLAYER_CAMERA;
let PLAYER_ROOT_CAMERA;
const URL_ROOT = "https://raw.githubusercontent.com/orion3dgames/t5c/feature/vat-skin";

var createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, scene);

    // UI
    let ADT = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI_Names", true, scene);

    let helpBox = new BABYLON.GUI.TextBlock("helpBox");
    helpBox.text = " Left click & drag to move \n Middle mouse click and drag to rotate camera \n Digit 1 to remove/add helmet ";
    helpBox.fontSize = "16px";
    helpBox.fontWeight = "bold";
    helpBox.color = "white";
    helpBox.resizeToFit = true;
    helpBox.top = "15px;";
    helpBox.left = "15px;";
    helpBox.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    helpBox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    helpBox.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    helpBox.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    ADT.addControl(helpBox);

    //
    buildCamera(scene);

    // PRELOAD DATA
    loadAssets(scene);

    return scene;
};

function buildCamera(scene) {
    // root camera parent that handles positioning of the camera to follow the player
    PLAYER_ROOT_CAMERA = new BABYLON.TransformNode("root");
    PLAYER_ROOT_CAMERA.position = new BABYLON.Vector3(0, 1.5, 0); //initialized at (0,0,0)

    // to face the player from behind (180 degrees)
    PLAYER_ROOT_CAMERA.rotation = new BABYLON.Vector3(0, (3 / 4) * Math.PI, 0);

    // rotations along the x-axis (up/down tilting)
    const yTilt = new BABYLON.TransformNode("ytilt");

    // adjustments to camera view to point down at our player
    yTilt.rotation = new BABYLON.Vector3(0.6, 0, 0);
    yTilt.parent = PLAYER_ROOT_CAMERA;

    // our actual camera that's pointing at our root's position
    PLAYER_CAMERA = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 0, -45), scene);
    PLAYER_CAMERA.lockedTarget = PLAYER_ROOT_CAMERA.position;
    PLAYER_CAMERA.fov = 0.35;
    PLAYER_CAMERA.parent = yTilt;

    // set as active camera
    scene.activeCamera = PLAYER_CAMERA;
    scene.cameraToUseForPointers = PLAYER_CAMERA; // is this necessary?
}

async function loadAssets(scene) {
    let assetsManager = new BABYLON.AssetsManager(scene);
    let assetLoaded = [];
    let assetDatabase = new Map();
    SPAWN_INFO.map((spawn) => {
        assetDatabase.set("RACE_" + spawn.key, { name: "RACE_" + spawn.key, filename: "races/" + spawn.key + ".glb", extension: "glb" });
        spawn.items.forEach((item) => {
            assetDatabase.set("ITEM_" + item.key, { name: "ITEM_" + item.key, filename: "items/" + item.key + ".glb", extension: "glb" });
        });
    });
    assetDatabase.forEach((obj) => {
        let assetTask;

        switch (obj.extension) {
            case "glb":
                assetTask = assetsManager.addContainerTask(obj.name, "", "", URL_ROOT + "/public/models/" + obj.filename);
                break;
            case "json":
                assetTask = assetsManager.addTextFileTask(obj.name, URL_ROOT + "/public/models/" + obj.filename);
                break;
        }

        assetTask.onSuccess = (task) => {
            switch (task.constructor) {
                case BABYLON.ContainerAssetTask:
                    assetLoaded[task.name] = task.loadedContainer;
                    break;
                case BABYLON.TextFileAssetTask:
                    assetLoaded[task.name] = task.text;
                    break;
            }
        };
    });
    assetsManager.onProgress = (remainingCount, totalCount, lastFinishedTask) => {};
    assetsManager.onFinish = () => {
        for (let i in assetLoaded) {
            ASSETS_LOADED.set(i, assetLoaded[i]);
        }
        console.log("Loading Complete...", ASSETS_LOADED);
    };

    await assetsManager.loadAsync();

    // PREPARE RACES MODELS FOR VAT
    for (let spawn of SPAWN_INFO) {
        if (!ENTITY_DATA.has(spawn.key)) {
            await prepareModel(scene, spawn);
        }
    }
    console.log("prepareModel", "ALL FINISHED");

    // small timeout to fix await above not working? else ENTITY_DATA is empty
    runGameLoop(scene);
}

function runGameLoop(scene) {
    console.log("game loop running", ENTITY_DATA);

    // spawn players
    let players = new Map();
    SPAWN_INFO.forEach((spawn) => {
        let entityData = ENTITY_DATA.get(spawn.key);
        for (let i = 0; i < spawn.quantity; i++) {
            let sessionId = Math.random() * 10000;
            let instance = entityData.mesh.createInstance("entity_" + sessionId);
            players.set(sessionId, new Entity(sessionId, scene, instance, entityData, spawn, false));
        }
    });
    // add player
    spawn = SPAWN_INFO[0];
    let entityData = ENTITY_DATA.get("male_knight");
    let sessionId = "player";
    let instance = entityData.mesh.createInstance("instance_" + sessionId);
    players.set(sessionId, new Entity(sessionId, scene, instance, entityData, spawn, true));

    // game loop
    scene.registerBeforeRender(() => {
        // vat loop
        ENTITY_DATA.forEach((entityData) => {
            entityData.vat.time += scene.getEngine().getDeltaTime() / 1000.0;
        });

        // player loop
        players.forEach((player) => {
            player.update();
        });
    });

    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                if (kbInfo.event.code === "Digit1") {
                    INPUT_DATA.digit1 = true;
                }
                break;

            case BABYLON.KeyboardEventTypes.KEYUP:
                if (kbInfo.event.code === "Digit1") {
                    INPUT_DATA.digit1 = false;
                }
                break;
        }
    });

    scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            // left click
            if (pointerInfo.event.button == 0) {
                INPUT_DATA.left_click = true;
            }
            // middle click
            if (pointerInfo.event.button == 1) {
                INPUT_DATA.middle_click = true;
            }
        }

        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
            // left click
            if (pointerInfo.event.button == 0) {
                INPUT_DATA.left_click = false;
                INPUT_DATA.angle = 0;
                INPUT_DATA.vertical = 0;
                INPUT_DATA.horizontal = 0;
                INPUT_DATA.player_can_move = false;
            }
            // middle click
            if (pointerInfo.event.button == 1) {
                INPUT_DATA.middle_click = false;
            }
        }

        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
            if (INPUT_DATA.left_click) {
                INPUT_DATA.player_can_move = true;
                let dpi = window.devicePixelRatio;
                let editor = document.getElementById("monacoHost");
                let offsetX = editor.offsetWidth;
                INPUT_DATA.x = (((pointerInfo.event.clientX - offsetX) * dpi) / pointerInfo.event.target.width) * 2 - 1;
                INPUT_DATA.y = ((pointerInfo.event.clientY * dpi) / pointerInfo.event.target.height) * 2 - 1;
                INPUT_DATA.angle = Math.atan2(INPUT_DATA.x, INPUT_DATA.y);
                if (INPUT_DATA.angle !== 0) {
                    INPUT_DATA.vertical = -Math.cos(INPUT_DATA.angle + Math.PI - INPUT_DATA.camY);
                    INPUT_DATA.horizontal = Math.sin(INPUT_DATA.angle + Math.PI - INPUT_DATA.camY);
                }
            }
        }

        if (INPUT_DATA.middle_click) {
            INPUT_DATA.movementX = pointerInfo.event.movementX / 100;
            INPUT_DATA.movementY = pointerInfo.event.movementY / 75;
        }

        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
            let metadata = getMeshMetadata(pointerInfo);
            let entity = players.get(metadata.sessionId);
            if (entity) {
                let rand = Math.floor(randomNumberInRange(0, 6));
                if (rand <= 2) entity._nextAnim = "DEATH";
                if (rand === 3) entity._nextAnim = "WALKING";
                if (rand === 4) entity._nextAnim = "IDLE";
                if (rand === 5) entity._nextAnim = "ATTACK";
                console.log(rand, entity, entity._nextAnim);
            }
        }
    });
}

function getMeshMetadata(pointerInfo) {
    if (!pointerInfo._pickInfo.pickedMesh) return false;

    if (!pointerInfo._pickInfo.pickedMesh.metadata) return false;

    if (pointerInfo._pickInfo.pickedMesh.metadata === null) return false;

    return pointerInfo._pickInfo.pickedMesh.metadata;
}

// get random item from a Set
function getRandomItem(players) {
    const rand = Math.floor(Math.random() * players.size);
    const mapKeys = Array.from(players.keys());
    return players.get(mapKeys[rand]);
}

async function fetchVAT(key) {
    const response = await fetch(URL_ROOT + "/public/models/races/vat/" + key + ".json");
    const movies = await response.json();
    return movies;
}

// prepare model
async function prepareModel(scene, spawn) {
    console.log("prepareMesh", spawn.key);

    const PICKED_ANIMS = spawn.animations;

    const bakedAnimationJson = await fetchVAT(spawn.key);

    const { meshes, animationGroups, skeletons } = ASSETS_LOADED.get("RACE_" + spawn.key);

    animationGroups.forEach((ag) => ag.stop());

    const selectedAnimationGroups = animationGroups.filter((ag) => PICKED_ANIMS.includes(ag.name));

    const skeleton = skeletons[0];
    const root = meshes[0];
    root.name = "__root__model";

    root.position.setAll(0);
    root.scaling.setAll(1);
    root.rotationQuaternion = null;
    root.rotation.setAll(0);
    root.setEnabled(false);

    const modelMeshMerged = mergeModel(root, skeleton);

    if (modelMeshMerged) {
        modelMeshMerged.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
        modelMeshMerged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new BABYLON.Vector4(0, 0, 0, 0);

        const ranges = calculateRanges(selectedAnimationGroups);

        const b = new BABYLON.VertexAnimationBaker(scene, modelMeshMerged);
        const manager = new BABYLON.BakedVertexAnimationManager(scene);

        modelMeshMerged.bakedVertexAnimationManager = manager;
        modelMeshMerged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new BABYLON.Vector4(0, 0, 0, 0);

        let raceKey = spawn.key + "_0";
        let clone = modelMeshMerged.clone(raceKey);
        clone.bakedVertexAnimationManager = manager;
        clone.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
        clone.instancedBuffers.bakedVertexAnimationSettingsInstanced = new BABYLON.Vector4(0, 0, 0, 0);
        clone.setEnabled(false);

        // prepare  items
        let itemMeshes = new Map();
        for (let itemKey in ITEM_DATA) {
            let item = ITEM_DATA[itemKey];
            let equipOptions = item.equippable;
            let boneId = spawn.bones[item.equippable.slot] ?? 0;
            let rawMesh = ASSETS_LOADED.get("ITEM_" + item.key).meshes[0];

            rawMesh.position.copyFrom(skeleton.bones[boneId].getAbsolutePosition()); // must be set in Blender
            rawMesh.rotationQuaternion = undefined;
            rawMesh.rotation.set(0, Math.PI * 1.5, 0); // we must set it in Blender
            rawMesh.scaling.setAll(1);

            ////////////////////////////////
            // if mesh offset required
            if (equipOptions.scale) {
                rawMesh.scaling = new BABYLON.Vector3(equipOptions.scale, equipOptions.scale, equipOptions.scale);
            }
            if (equipOptions.offset_x) {
                rawMesh.position.x += equipOptions.offset_x;
            }
            if (equipOptions.offset_y) {
                rawMesh.position.y += equipOptions.offset_y;
            }
            if (equipOptions.offset_z) {
                rawMesh.position.z += equipOptions.offset_z;
            }

            // if rotationFix needed
            if (equipOptions.rotation_x || equipOptions.rotation_y || equipOptions.rotation_z) {
                // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
                rawMesh.rotationQuaternion = null;
                rawMesh.rotation.set(equipOptions.rotation_x ?? 0, equipOptions.rotation_y ?? 0, equipOptions.rotation_z ?? 0);
            }
            ///////////////////////
            let itemMesh = mergeItem(rawMesh);

            if (itemMesh) {
                // weapon VAT
                itemMesh.skeleton = skeleton;
                itemMesh.bakedVertexAnimationManager = manager;
                itemMesh.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
                itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced = new BABYLON.Vector4(0, 0, 0, 0);

                // manually set MatricesIndicesKind & MatricesWeightsKind
                // https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons#preparing-mesh
                const totalCount = itemMesh.getTotalVertices();
                const weaponMI = [];
                const weaponMW = [];
                for (let i = 0; i < totalCount; i++) {
                    weaponMI.push(boneId, 0, 0, 0);
                    weaponMW.push(1, 0, 0, 0);
                }

                itemMesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, weaponMI, false);
                itemMesh.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, weaponMW, false);

                // hide merged mesh
                itemMesh.setEnabled(false);

                // save mesh
                itemMeshes.set(itemKey, itemMesh);
            }
        }

        // load baked animation from json
        let bufferFromMesh = await b.loadBakedVertexDataFromJSON(bakedAnimationJson);
        manager.texture = b.textureFromBakedVertexData(bufferFromMesh);

        // hide merged mesh
        modelMeshMerged.setEnabled(false);

        // save
        ENTITY_DATA.set(spawn.key, {
            mesh: clone,
            animationRanges: ranges,
            animationGroups: animationGroups,
            selectedAnimationGroups: selectedAnimationGroups,
            vat: manager,
            items: itemMeshes,
        });

        console.log("prepareMesh", spawn.key, "finishes");
    }
}

function mergeModel(mesh, skeleton) {
    // pick what you want to merge
    const allChildMeshes = mesh.getChildTransformNodes(true)[0].getChildMeshes(false);
    // multiMaterial = true
    const merged = BABYLON.Mesh.MergeMeshes(allChildMeshes, false, true, undefined, undefined, true);
    merged.name = "_MergedModel";
    merged.skeleton = skeleton;
    return merged;
}

function mergeItem(mesh, key = "MERGED_") {
    const allChildMeshes = mesh.getChildMeshes(false);
    const merged = BABYLON.Mesh.MergeMeshes(allChildMeshes, false, false, undefined, false, false);
    if (merged) {
        merged.name = key + "_" + mesh.name;
        return merged;
    }
}

function calculateRanges(animationGroups) {
    return animationGroups.reduce((acc, ag, index) => {
        if (index === 0) {
            acc.push({ from: Math.floor(ag.from), to: Math.floor(ag.to) });
        } else {
            const prev = acc[index - 1];
            acc.push({ from: prev.to + 1, to: prev.to + 1 + Math.floor(ag.to) });
        }
        return acc;
    }, []);
}

const randomNumberInRange = function (min, max) {
    return Math.random() * (max - min) + min;
};

class Entity extends BABYLON.TransformNode {
    game;
    ui;
    mesh;
    entityData;
    spawnInfo;
    currentAnimationRange = 0;
    currentAnimationIndex = 0;
    equipments;

    fromFrame;
    toFrame;
    endOfLoop = false;
    _currentAnim;
    _prevAnim;
    _nextAnim;
    _currentAnimVATOffset;
    _currentAnimVATTimeAtStart;

    _walking;
    _idle;
    _death;
    _attack;

    sessionId;
    nextPosition;
    nextRotation;
    camera;
    timer = 0;
    heightChange;

    isPlayer = false;
    target;

    constructor(name, scene, playerInstance, entityData, spawnInfo, isPlayer = false) {
        super(name, scene);

        this.sessionId = name;
        this.isPlayer = isPlayer;

        // prepare player mesh
        playerInstance.setParent(this);
        playerInstance.rotation.y = 0;
        playerInstance.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        if (spawnInfo.rotationFix) {
            playerInstance.rotation.set(0, spawnInfo.rotationFix, 0);
        }
        playerInstance.scaling.set(spawnInfo.scale, spawnInfo.scale, spawnInfo.scale);
        this.mesh = playerInstance;
        this.entityData = entityData;

        this.mesh.metadata = {
            sessionId: this.sessionId,
        };

        //
        this.mesh.instancedBuffers.bakedVertexAnimationSettingsInstanced = new BABYLON.Vector4(0, 0, 0, 0);

        // initial spawn position
        this.target = new BABYLON.Vector3(0, 0, 0);
        this.position = new BABYLON.Vector3(randomNumberInRange(-PLANE_SIZE, PLANE_SIZE), 0, randomNumberInRange(-PLANE_SIZE, PLANE_SIZE));
        this.nextPosition = new BABYLON.Vector3(0, 0, 0);
        this.nextRotation = new BABYLON.Vector3(0, 0, 0);
        this.nextPosition.set(this.position.x, this.position.y, this.position.z);

        // add equipment
        this.equipments = new Map();
        spawnInfo.items.forEach((e) => {
            this.addItem(e.key);
        });

        // PREPARE ANIMATIONS
        this._attack = {
            index: 0,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[0],
        };
        this._death = {
            index: 1,
            loop: false,
            speed: 1,
            ranges: this.entityData.animationRanges[1],
        };
        this._idle = {
            index: 2,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[2],
        };
        this._walking = {
            index: 3,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[3],
        };

        this._currentAnim = this._idle;
        this._nextAnim = "IDLE";
    }

    isMoving(currentPos, nextPos, epsilon = 0.05) {
        return !currentPos.equalsWithEpsilon(nextPos, epsilon);
    }

    move() {
        let speed = 0.15;

        // save current position
        let oldX = this.nextPosition.x;
        let oldY = this.nextPosition.y;
        let oldZ = this.nextPosition.z;
        const newRotY = Math.atan2(INPUT_DATA.horizontal, INPUT_DATA.vertical);

        // calculate new position
        let newX = oldX - INPUT_DATA.horizontal * speed;
        let newZ = oldZ - INPUT_DATA.vertical * speed;
        this.nextPosition.x = newX;
        this.nextPosition.z = newZ;
        this.nextPosition.y = 0;
        this.nextRotation.y = this.nextRotation.y + (newRotY - this.nextRotation.y);
    }

    animate() {
        if (this.isMoving(this.position, this.nextPosition)) {
            this._currentAnim = this._walking;
        } else if (this._nextAnim === "WALKING") {
            this._currentAnim = this._walking;
        } else if (this._nextAnim === "DEATH") {
            this._currentAnim = this._death;
        } else if (this._nextAnim === "ATTACK") {
            this._currentAnim = this._attack;
        } else {
            this._currentAnim = this._idle;
        }
    }

    followCamera() {
        PLAYER_ROOT_CAMERA.position = this.position;
        if (INPUT_DATA.middle_click) {
            const rotationX =
                Math.abs(PLAYER_ROOT_CAMERA.rotation.x + INPUT_DATA.movementY) < 0.5
                    ? PLAYER_ROOT_CAMERA.rotation.x + INPUT_DATA.movementY
                    : PLAYER_ROOT_CAMERA.rotation.x;
            const rotationY = PLAYER_ROOT_CAMERA.rotation.y + INPUT_DATA.movementX;
            PLAYER_ROOT_CAMERA.rotation = new BABYLON.Vector3(rotationX, rotationY, 0);
        }
    }

    addItem(key) {
        let item = ITEM_DATA[key];

        // create instance of mesh
        let instance = this.entityData.items.get(item.key).createInstance("equip_" + this.sessionId + "_" + key);
        instance.instancedBuffers.bakedVertexAnimationSettingsInstanced = new BABYLON.Vector4(0, 0, 0, 0);
        instance.isPickable = true;

        instance.metadata = {
            sessionId: this.sessionId,
        };

        // or like this(so we don't need to sync it every frame)
        instance.setParent(this.mesh);
        instance.position.setAll(0);
        instance.rotationQuaternion = undefined;
        instance.rotation.setAll(0);

        //
        this.equipments.set(item.key, instance);
    }

    getPosition() {
        return new BABYLON.Vector3(this.position.x, this.position.y, this.position.z);
    }

    moveTowards() {
        // move entity
        if (this.target) {
            let currentPos = this.getPosition();
            let destination = this.target;

            // calculate next position towards destination
            let updatedPos = this.moveTo(currentPos, destination, 0.45);
            this.nextPosition.copyFrom(updatedPos);

            // calculate rotation
            this.rot = Math.atan2(currentPos.x - updatedPos.x, currentPos.z - updatedPos.z);

            // check if arrived at waypoint
            let distance = new BABYLON.Vector3.Distance(updatedPos, destination);
            if (distance < 1) {
                this.target = false;
            }
            //}
        } else {
            console.error("moveTowards failed");
        }
    }

    moveTo(source, destination, speed) {
        let currentX = source.x;
        let currentZ = source.z;
        let targetX = destination.x;
        let targetZ = destination.z;
        let newPos = new BABYLON.Vector3(source.x, source.y, source.z);
        if (targetX < currentX) {
            newPos.x -= speed;
            if (newPos.x < targetX) {
                newPos.x = targetX;
            }
        }
        if (targetX > currentX) {
            newPos.x += speed;
            if (newPos.x > targetX) {
                newPos.x = targetX;
            }
        }
        if (targetZ < currentZ) {
            newPos.z -= speed;
            if (newPos.z < targetZ) {
                newPos.z = targetZ;
            }
        }
        if (targetZ > currentZ) {
            newPos.z += speed;
            if (newPos.z > targetZ) {
                newPos.z = targetZ;
            }
        }
        return newPos;
    }

    ///////////////////////////
    update(player, delta) {
        // calculate next position based on input
        if (this.isPlayer && INPUT_DATA.player_can_move === true) {
            this.move();
        }

        // calculate animation to play
        this.animate();

        if (this.isPlayer) {
            INPUT_DATA.camY = PLAYER_ROOT_CAMERA.rotation.y;
        } else {
            // has target
            if (!this.target) {
                this.target = new Vector3(randomNumberInRange(-PLANE_SIZE, PLANE_SIZE), 0, randomNumberInRange(-PLANE_SIZE, PLANE_SIZE));
            }

            this.moveTowards();
        }

        // tween position
        this.position = BABYLON.Vector3.Lerp(this.position, this.nextPosition, 0.1);
        const gap = Math.abs(this.rotation.y - this.nextRotation.y);
        if (gap > Math.PI) this.rotation.y = this.nextRotation.y;
        else this.rotation = BABYLON.Vector3.Lerp(this.rotation, this.nextRotation, 0.45);

        // move camera
        if (this.isPlayer) {
            this.followCamera();

            // player events
            if (INPUT_DATA.digit1 === true) {
                if (this.equipments.has("helm_01")) {
                    this.equipments.get("helm_01").dispose();
                    this.equipments.delete("helm_01");
                } else {
                    this.addItem("helm_01");
                }

                INPUT_DATA.digit1 = false;
            }
        }

        // play animation and stop previous animation
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            //console.log("CHANGE ANIMATION TO", this._currentAnim);
            this.setAnimationParameters(this.mesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim);

            this.equipments.forEach((itemMesh) => {
                //console.log("EQUIPEMENT CHANGE ANIMATION TO", this._currentAnim);
                this.setAnimationParameters(itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim);
            });

            this._prevAnim = this._currentAnim;
            this.endOfLoop = false;
        }

        const currentVATTime = this.entityData.vat.time;
        const currentAnimFrame = Math.floor((currentVATTime - this._currentAnimVATTimeAtStart) * 60);

        // if animation is loop=false; and finished playing
        if (currentAnimFrame >= this.toFrame - this.fromFrame && this._currentAnim.loop === false && this.endOfLoop === false) {
            console.log("ANIMATION FINISHED, STOP ANIMATION ", this.currentFrame, this.targetFrame);
            this.mesh.instancedBuffers.bakedVertexAnimationSettingsInstanced.set(this.toFrame - 1, this.toFrame, this._currentAnimVATOffset, 60);
            this.endOfLoop = true;
            this.equipments.forEach((itemMesh) => {
                itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced.set(this.toFrame - 1, this.toFrame, this._currentAnimVATOffset, 60);
            });
            setTimeout(() => {
                this.endOfLoop = false;
                this._currentAnim = this._idle;
                this._prevAnim = null;
                this._nextAnim = "";
            }, 2000);
        }
    }

    // This method will compute the VAT offset to use so that the animation starts at frame #0 for VAT time = time passed as 3rd parameter
    computeOffsetInAnim(fromFrame, toFrame, time, fps = 60) {
        const totalFrames = toFrame - fromFrame + 1;
        const t = (time * fps) / totalFrames;
        const frame = Math.floor((t - Math.floor(t)) * totalFrames);
        return totalFrames - frame;
    }

    setAnimationParameters(vec, currentAnim, delta = 60) {
        const animIndex = currentAnim.index ?? 0;
        const anim = this.entityData.animationRanges[animIndex];

        const from = Math.floor(anim.from);
        const to = Math.floor(anim.to);

        this.fromFrame = from;
        this.toFrame = to - 1;

        this._currentAnimVATTimeAtStart = this.entityData.vat.time;
        this._currentAnimVATOffset = this.computeOffsetInAnim(this.fromFrame, this.toFrame, this._currentAnimVATTimeAtStart, delta);

        vec.set(this.fromFrame, this.toFrame, this._currentAnimVATOffset, delta); // skip one frame to avoid weird artifacts
    }
}
