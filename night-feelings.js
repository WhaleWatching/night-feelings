// I couldn't cope if you crashed today.

(function (THREE, Detector, window, document) {

  if(! Detector.webgl) {
    Detector.addGetWebGLMessage();
    throw("Error: WebGL support requested");
  }

  var
    renderer, camera, scene, composer,
    // Lights
    ambient_light, sun_light, hemiLight,
    // Waters
    water, water_normals, mirror_mesh,
    // Sky
    sky, sun_sphere,
    // Words
    words_objects;

  var
    scene_width = 1120,
    scene_height = 630;

  var scene_params = {
    width: 400,
    height: 200,
    widthSegments: 250,
    heightSegments: 250,
    depth: 1500,
    param: 4,
    filterparam: 1
  };

  init();
  update();

  function init () {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(scene_width, scene_height);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.querySelector('article.stage').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera =
      new THREE.PerspectiveCamera(90, scene_width/scene_height, 0.5, 1000000);
    camera.position.set(0, 1600, 1500);
    // camera.position.set(400, 600, 800);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // Lights

    ambient_light = new THREE.AmbientLight(0x444444);
    scene.add(ambient_light);
    sun_light = new THREE.DirectionalLight(0xffffff, 0.1);
    sun_light.position.set(-0.98, 1, -1);
    scene.add(sun_light);

    hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHex( 0xdddddd );
    hemiLight.groundColor.setHex( 0x000000 );
    scene.add( hemiLight );

    // Waters

    (new THREE.TextureLoader()).load('textures/waternormals.jpg', function (texture) {
      water_normals = texture;
      water_normals.wrapS = water_normals.wrapT = THREE.RepeatWrapping;
      water = new THREE.Water(renderer, camera, scene, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: water_normals,
        alpha:  1.0,
        sunDirection: sun_light.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 50.0
      });
      mirror_mesh = new THREE.Mesh(
          new THREE.PlaneBufferGeometry(scene_params.width * 500, scene_params.height * 500),
          water.material
        );

      mirror_mesh.add(water);
      mirror_mesh.rotation.x = - Math.PI * 0.5;
      scene.add(mirror_mesh);
    });

    // Helper
    var helper = new THREE.GridHelper( 1200, 1200 );
    helper.position.y = 20
    helper.color1.setHex( 0xffffff );
    helper.color2.setHex( 0xffffff );
    // scene.add( helper );

    // addSkybox();
    addSkyShader();


    // TextGeometry

    var text_material = new THREE.MeshPhongMaterial({
      color: 0xffffff
    });
    function getTextMeshOf (str) {
      var text_geometry = new THREE.TextGeometry(str, {
        size: 18,
        height: 1,
        curveSegments: 12,
        font: 'helvetiker',
        weight: 'normal',
        style: 'normal',
        bevelEnabled: false
      });
      return new THREE.Mesh(text_geometry, text_material);
    }

    function getTextMeshGroupOf (strings) {
      var group = new THREE.Object3D();
      for (var i = strings.length - 1; i >= 0; i--) {
        var str = strings[i];
        var newText = getTextMeshOf(str);
        newText.position.y = -40 * i;
        group.add(newText);
      };

      group.position.set(0, 1520, 1200);
      group.rotation.x = - Math.PI * 0.26;
      return group;
    }

    words_objects = {
      afternoon: getTextMeshGroupOf(['you shall come back', 'tonight']),
      sunset: getTextMeshGroupOf(['night', 'sun is moving down', 'birds are dying']),
      dry: getTextMeshGroupOf(['dry', 'don\'t stop trying', 'lines here', 'implies way']),
      wayout: getTextMeshGroupOf(['a way out', 'are you following?']),
      following: getTextMeshGroupOf(['are you following?'])
    }

    scene.add(words_objects.following);

  }

  function addSkyShader() {
    // Sky mesh
    sky = new THREE.Sky();
    scene.add(sky.mesh);

    // Sun helper
    sun_sphere = new THREE.Mesh(
        new THREE.SphereBufferGeometry(20000, 16, 8),
        new THREE.MeshBasicMaterial({color: 0xffffff})
      );
    sun_sphere.position.y = - 700000;
    sun_sphere.visible = false;
    scene.add(sun_sphere);

    // params
    var effectController  = {
      turbidity: 10,
      reileigh: 2,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
      luminance: 1,
      inclination: 0.48, // elevation / inclination
      azimuth: 0.13, // Facing front,
      sun: ! true
    };

    var distance = 400000;

    function setSkyState () {
      var uniforms = sky.uniforms;
      uniforms.turbidity.value = effectController.turbidity;
      uniforms.reileigh.value = effectController.reileigh;
      uniforms.luminance.value = effectController.luminance;
      uniforms.mieCoefficient.value = effectController.mieCoefficient;
      uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

      var theta = Math.PI * ( effectController.inclination - 0.5 );
      var phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );

      sun_sphere.position.x = distance * Math.cos( phi );
      sun_sphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
      sun_sphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );

      sun_sphere.visible = effectController.sun;

      sky.uniforms.sunPosition.value.copy( sun_sphere.position );
    }

    setSkyState();

  }

  function update () {
    window.requestAnimationFrame(update);
    render();
  }

  function render () {
    if(water) {
      water.material.uniforms.time.value += 1.0 / 60.0;
      water.render();
    }
    renderer.render( scene, camera );
  }

  function directorUpdate() {
    
  }

})(THREE, Detector, window, document);