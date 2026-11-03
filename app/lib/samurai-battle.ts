import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneRig } from "three/addons/utils/SkeletonUtils.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

type PortraitActor = {
  root: THREE.Group;
  rightArm: THREE.Object3D | null;
  rightForeArm: THREE.Object3D | null;
  spine: THREE.Object3D | null;
  head: THREE.Object3D | null;
  rest: Map<THREE.Object3D, THREE.Quaternion>;
};

/** A single textured samurai portrait, framed and gently animated by hero scroll. */
export class SamuraiPortraitScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private environmentTarget: THREE.WebGLRenderTarget;
  private actor: PortraitActor | null = null;
  private disposed = false;
  private progress = 0;
  private resizeObserver: ResizeObserver;

  constructor(private mount: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.className = "samurai-canvas";
    this.mount.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environmentTarget = pmrem.fromScene(new RoomEnvironment());
    this.scene.environment = this.environmentTarget.texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(32, 1, .1, 40);
    this.camera.position.set(0, 1.5, 2.85);
    this.scene.add(new THREE.HemisphereLight(0xc7d2df, 0x211116, 2.1));

    const key = new THREE.DirectionalLight(0xffe6cf, 3.7);
    key.position.set(-3.5, 5, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);
    const redRim = new THREE.PointLight(0xc3383f, 38, 8, 2);
    redRim.position.set(2.8, 1.4, -1.5);
    this.scene.add(redRim);
    const coolRim = new THREE.PointLight(0x9aacbf, 22, 7, 2);
    coolRim.position.set(-3, 2.2, 1.4);
    this.scene.add(coolRim);

    const loader = new GLTFLoader();
    loader.load("/models/samurai-rigged.glb", (gltf) => {
      if (this.disposed) return;
      const model = cloneRig(gltf.scene) as THREE.Group;
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          object.frustumCulled = false;
        }
      });
      const root = new THREE.Group();
      root.add(model);
      model.position.y = -.87;
      root.scale.setScalar(1.66);
      root.rotation.y = -.18;
      this.scene.add(root);

      const joints = ["Spine", "Spine01", "Spine02", "Head", "RightArm", "RightForeArm"]
        .map((name) => model.getObjectByName(name) ?? null);
      const rest = new Map<THREE.Object3D, THREE.Quaternion>();
      joints.forEach((joint) => { if (joint) rest.set(joint, joint.quaternion.clone()); });
      this.actor = {
        root,
        spine: model.getObjectByName("Spine02") ?? model.getObjectByName("Spine") ?? null,
        head: model.getObjectByName("Head") ?? null,
        rightArm: model.getObjectByName("RightArm") ?? null,
        rightForeArm: model.getObjectByName("RightForeArm") ?? null,
        rest,
      };
      this.setProgress(this.progress);
    }, undefined, () => {
      if (!this.disposed) this.mount.dataset.unavailable = "true";
    });

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.mount);
    this.resize();
  }

  resize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.render();
  };

  setProgress(progress: number) {
    if (this.disposed) return;
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    this.progress = p;
    const actor = this.actor;
    if (actor) {
      const turn = THREE.MathUtils.smoothstep(p, .08, .92);
      const settle = Math.sin(p * Math.PI);
      actor.root.position.set(.18 * turn, -.06 + settle * .035, 0);
      actor.root.rotation.y = -.25 + turn * .5;
      actor.root.rotation.z = -.025 + settle * .035;
      actor.root.scale.setScalar(1.66 + settle * .04);
      const bodyPose = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.07 * settle, .04 * turn, -.02 * settle));
      const armPose = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.05 * turn, 0, -.14 - .12 * settle));
      const forearmPose = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.03 * turn, 0, -.08 - .08 * settle));
      const headPose = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, .1 * turn, 0));
      for (const [joint, base] of actor.rest) {
        const pose = joint === actor.spine ? bodyPose : joint === actor.head ? headPose : joint === actor.rightArm ? armPose : joint === actor.rightForeArm ? forearmPose : new THREE.Quaternion();
        joint.quaternion.copy(base).multiply(pose);
      }
    }
    this.camera.position.x = -.05 + .24 * turnForCamera(p);
    this.camera.position.y = 1.48 + .06 * Math.sin(p * Math.PI);
    this.camera.position.z = 2.85 - .12 * Math.sin(p * Math.PI);
    this.camera.lookAt(.12, 1.62, 0);
    this.render();
  }

  private render() {
    if (!this.disposed) this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    this.resizeObserver.disconnect();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) value.dispose();
          });
          material.dispose();
        });
      }
    });
    this.environmentTarget.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

function turnForCamera(progress: number) {
  return THREE.MathUtils.smoothstep(progress, .08, .92);
}
