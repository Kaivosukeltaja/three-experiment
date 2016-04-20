require({
    baseUrl: 'js',
    // three.js should have UMD support soon, but it currently does not
    shim: { 'vendor/three': { exports: 'THREE' } }
}, [
    'vendor/three',
    'Mirror'
], function(THREE) {

var scene, camera, reflectCamera, renderer, loader;
var geometry, material, mesh, skyMesh, skyTexture;
var redLight, greenLight;

var loaders = {
    cube: new THREE.CubeTextureLoader(),
    json: new THREE.JSONLoader(),
    texture: new THREE.TextureLoader()
}

var sky = {
    loader: loaders.cube,
    mesh: null,
    texture: null,
    shader: null,
    uniforms: null,
    material: null
};

var mirror = {};
var lights = {};

var meltArray;

//var modelfile = 'houston.mesh.json';
var modelfile = 'monkey.mesh.json';

init();
window.addEventListener('resize', resizeView, false);

function init() {

    scene = new THREE.Scene();
    loader = loaders.json;

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    //camera = new THREE.OrthographicCamera(0 / window.innerWidth, 0 / window.innerHeight, 1, 10000 );
    camera.position.z = 50;

    // geometry = new THREE.BoxGeometry( 200, 200, 200 );

    lights.red =
      new THREE.PointLight(0x880000); 

    lights.green =
      new THREE.PointLight(0x008800); 

    lights.sun =
      new THREE.PointLight(0xffffcc); 

    lights.ambient = new THREE.AmbientLight(0x404040);

    lights.red.position.x = 410;
    lights.red.position.y = 100;
    lights.red.position.z = 300;

    lights.green.position.x = -410;
    lights.green.position.y = -100;
    lights.green.position.z = 300;

    lights.sun.position.x = 10;
    lights.sun.position.y = 10;
    lights.sun.position.z = 300;

    //scene.add(lights.red);
    //scene.add(lights.green);
    scene.add(lights.ambient);
    scene.add(lights.sun);

    initModels();
    initSky();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

}

function resizeView() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();    
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function initModels() {

    loader.load(modelfile, function(geometry) {
        //material = new THREE.MeshLambertMaterial( { color: material } );
        material = new THREE.MeshPhongMaterial({ 
            emissive: 0x666666,
            shading: THREE.FlatShading
        });

        loaders.texture.load('monkey.png', function(texture) {
            material = new THREE.MeshPhongMaterial({ 
                emissive: 0x333333,
                reflectivity: 0.7,
                shininess: 100,
                map: texture,
                envMap: sky.texture,
                shading: THREE.SmoothShading
            });
            mesh.material = material;
            console.log('texture loaded');
        });

        mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );
        initMelt();    
        initReflection();
        initMirror();
        animate();

    });

}

function initMirror() {
    /*
    mirror.camera = new THREE.CubeCamera(0.1, 1000, 512);
    scene.add(mirror.camera);
    mirror.material = new THREE.MeshPhongMaterial({ emissive: 0x111111, envMap: mirror.camera.renderTarget });
    mirror.geometry = new THREE.CylinderGeometry(30, 30, 2, 8);
    mirror.mesh = new THREE.Mesh(mirror.geometry, mirror.material);
    mirror.camera.position.y -= 18.0;
    */
    mirror.mirror = new THREE.Mirror(renderer, camera, { clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: 0x889999 });
    //mirror.geometry = new THREE.CylinderGeometry(30, 30, 2, 8);
    mirror.geometry = new THREE.PlaneBufferGeometry( 50.1, 50.1 );
    mirror.mesh = new THREE.Mesh(mirror.geometry, mirror.mirror.material);
    mirror.mesh.add(mirror.mirror); // ?
    mirror.mesh.position.y -= 18.0;
    mirror.mesh.rotation.x = -1.6;
    scene.add(mirror.mesh);
}

function initReflection() {
    //reflectCamera = new THREE.CubeCamera(0.1, 5000, 512);
    //scene.add(reflectCamera);
    //material = new THREE.MeshBasicMaterial({ color: 0x444444, envMap: sky.texture });
//    material = new THREE.MeshBasicMaterial({ color: 0x666666, envMap: reflectCamera.renderTarget });
    //material = new THREE.MeshPhongMaterial({ emissive: 0x111111, envMap: reflectCamera.renderTarget });
    //mesh.material = material;
}

function initSky() {
    var urls = [ 'img/posx.jpg', 'img/negx.jpg', 'img/posy.jpg', 'img/negy.jpg', 'img/posz.jpg', 'img/negz.jpg'];
    sky.texture = sky.loader.load(urls);
    
    sky.shader = THREE.ShaderLib['cube'];
    sky.uniforms = THREE.UniformsUtils.clone( sky.shader.uniforms );
    sky.uniforms['tCube'].value = sky.texture;    
    sky.material = new THREE.ShaderMaterial({
        fragmentShader: sky.shader.fragmentShader,
        vertexShader: sky.shader.vertexShader,
        uniforms: sky.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    });
    
    //sky.material = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: sky.texture });
    sky.geometry = new THREE.CubeGeometry(1000, 1000, 1000);
    //sky.mesh = new THREE.Mesh(new THREE.BoxGeometry(100000, 100000, 100000, 1, 1, 1, null, true), sky.material);
    sky.mesh = new THREE.Mesh(sky.geometry, sky.material);
    scene.add(sky.mesh);
}

function animate() {

    requestAnimationFrame( animate );

    //mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.005;
    mirror.mesh.rotation.z -= 0.01

    camera.rotation.y -= 0.001;
    camera.position.z = 50.0 * Math.cos(camera.rotation.y);
    camera.position.x = 50.0 * Math.sin(camera.rotation.y);
    // melt();

    if(typeof mirror.mirror !== 'undefined') {
        //mirror.camera.updateCubeMap(renderer, scene);
        //mirror.camera.updateCubeMap(renderer, scene);
        mirror.mirror.render();
    }
    renderer.render( scene, camera );

}

function initMelt() {
    meltArray = mesh.geometry.vertices.map(function() {
        return Math.random() * 0.01;
    });
    mesh.geometry.dynamic = true;
}

function melt() {
    mesh.geometry.vertices.forEach(function(vertex, index) {
        vertex.setComponent(1, vertex.getComponent(1) - meltArray[index]);
    });
    mesh.geometry.verticesNeedUpdate = true;
}

});
