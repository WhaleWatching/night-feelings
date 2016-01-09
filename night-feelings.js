// I couldn't cope if you crashed today.

(function (THREE, Detector, window, document) {

  if(! Detector.webgl) {
    Detector.addGetWebGLMessage();
    throw("Error: WebGL support requested");
  }

  var
    renderer, camera, scene, composer,
    // Lights
    ambient_light, sun_light, hemiLight, focus_light,
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
    height: 200
  };

  var box_max_count = 4000;


  // Box funcs
  var box_material = new THREE.MeshLambertMaterial({
    color: 0x666666,
    emissive: 0x000913
  });
  box_material.opacity = 0.6;
  box_material.transparent = true;
  var box_size = 100;
  var box_area = {
    left: -400,
    right: 400,
    top: -300,
    bottom: 30
  }

  var box_maze = [];
  var maze_container = new THREE.Object3D();

  var box_random_gen;

  var directions = [
    'left', 'right', 'front', 'back', 'top', 'bottom',
  ];

  function generateBoxAndSetAt (position) {
    var geo = new THREE.BoxGeometry(box_size, box_size, box_size);
    var mesh = new THREE.Mesh(geo, box_material);
    maze_container.add(mesh);
    mesh.position.set(position.x * box_size, (position.y + 1) * box_size, position.z * box_size);
    return mesh;
  }
  function pushNewBox () {
    // First one
    if (box_maze.length == 0) {
      box_maze.push({
        mesh: null,
        position: new THREE.Vector3(0, 0, 0),
        direction: directions[box_random_gen.betweenRound(0, 4)]
      });
      return;
    }

    var next_position = null;
    var pre_position = box_maze[box_maze.length - 1].position;
    var direction = box_maze[box_maze.length - 1].direction;
    var pre_direction = direction;

    if (box_random_gen.betweenRound(0, 100) > 50) {
      direction = directions[box_random_gen.betweenRound(0, 5)];
    }
    do {

      if (pre_position.y > 5 && direction == 'top') { direction = directions.slice(4,5)[box_random_gen.betweenRound(0, 4)]}
      if (pre_position.y < 0 && direction == 'bottom') { direction = directions[box_random_gen.betweenRound(0, 4)]}

      if (!(
        (pre_direction == 'left' && direction == 'right') ||
        (pre_direction == 'right' && direction == 'left') ||
        (pre_direction == 'top' && direction == 'bottom') ||
        (pre_direction == 'bottom' && direction == 'top') ||
        (pre_direction == 'front' && direction == 'back') ||
        (pre_direction == 'back' && direction == 'front')
        )) {
        break;
      }
      direction = directions[box_random_gen.betweenRound(0, 5)];
    } while(true)

    if (box_random_gen.betweenRound(0, 100) > 96) {
      var area_percent = box_maze.length / 8000 / 3 * 2;
      var z = box_random_gen.betweenRound(box_area.bottom - (box_area.bottom - box_area.top) * (area_percent + 0.3), box_area.bottom);
      var z_percent = (box_area.bottom - z) / (box_area.bottom - box_area.top);
      var x = box_random_gen.betweenRound(box_area.left * z_percent, box_area.right * z_percent);
      pre_position = new THREE.Vector3(x, box_random_gen.betweenRound(1, 4), z);
    }

    next_position = new THREE.Vector3(
      pre_position.x +
        (direction == 'left' ?
          -1 :(
            direction == 'right' ?
            1 :
            0
            )
          )
      ,
      pre_position.y +
        (direction == 'bottom' ?
          -1 :(
            direction == 'top' ?
            1 :
            0
            )
          )
      ,
      pre_position.z +
        (direction == 'back' ?
          -1 :(
            direction == 'front' ?
            1 :
            0
            )
          )
      );      

    box_maze.push({
      mesh: generateBoxAndSetAt(next_position),
      position: next_position,
      direction: direction
    });
  }


  (new THREE.TextureLoader()).load('textures/waternormals.jpg', init);

  function init (water_texture) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(scene_width, scene_height);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.querySelector('article.stage').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera =
      new THREE.PerspectiveCamera(90, scene_width/scene_height, 0.1, 300000);
    camera.position.set(0, 1600, 1500);
    // camera.position.set(0, 40000, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // Lights

    ambient_light = new THREE.AmbientLight(0x444444);
    scene.add(ambient_light);
    sun_light = new THREE.DirectionalLight(0xffffff, 0.4);
    sun_light.position.set(-0.98, 1, -1);
    scene.add(sun_light);

    hemiLight = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.6 );
    scene.add( hemiLight );

    focus_light = new THREE.PointLight(0xffffff, 1, 3000);
    focus_light.position.set(0, 400, 0);
    scene.add(focus_light);

    // Waters

    water_normals = water_texture;
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

    // Helper
    var helper = new THREE.GridHelper( 1200, 1200 );
    helper.position.y = 20
    helper.color1.setHex( 0xffffff );
    helper.color2.setHex( 0xffffff );
    // scene.add( helper );

    // addSkybox();
    addSkyShader();


    // TextGeometry

    var text_phong_material = new THREE.MeshPhongMaterial({
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
      return new THREE.Mesh(text_geometry, text_phong_material);
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
      group.rotation.x = - Math.PI * 0.23;
      return group;
    }

    words_objects = {
      comeback: getTextMeshGroupOf(['you should come back', 'tonight']),
      sunset: getTextMeshGroupOf(['night', 'sun is moving down']),
      empty: getTextMeshGroupOf(['empty, but with noise', 'hey', 'look!', 'some pathes there']),
      wayout: getTextMeshGroupOf(['got the way out', 'are you following?']),
      following: getTextMeshGroupOf(['are you following?'])
    }

    scene.add(maze_container);

    // Begin loop
    update();

    window.setInterval(directorUpdate, 200);
    directorUpdate();
  }

  var current_poem;
  function showPoem (poem_title) {
    if (current_poem) {
      if (current_poem === words_objects[poem_title]) {
        return;
      }
      scene.remove(current_poem);
    }
    current_poem = words_objects[poem_title];
    if (current_poem) {
      scene.add(current_poem);
    }
  }


  // Sky and sun light
  var setSkyState, sky_settings;

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
    sky_settings  = {
      turbidity: 10,
      reileigh: 2,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
      luminance: 1,
      inclination: 1.0, // elevation / inclination
      azimuth: 0.13, // Facing front,
      sun: ! true
    };

    var distance = 400000;

    setSkyState = function() {
      var uniforms = sky.uniforms;
      uniforms.turbidity.value = sky_settings.turbidity;
      uniforms.reileigh.value = sky_settings.reileigh;
      uniforms.luminance.value = sky_settings.luminance;
      uniforms.mieCoefficient.value = sky_settings.mieCoefficient;
      uniforms.mieDirectionalG.value = sky_settings.mieDirectionalG;

      var theta = Math.PI * ( sky_settings.inclination - 0.5 );
      var phi = 2 * Math.PI * ( sky_settings.azimuth - 0.5 );

      sun_sphere.position.x = distance * Math.cos( phi );
      sun_sphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
      sun_sphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );

      sun_sphere.visible = sky_settings.sun;

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

  function adjustSkyTo (value) {
    sky_settings.inclination = value;
    setSkyState();
    var x = 0.88 * value * 2;
    var y = 1 - x;
    if (y < 0.09) {
      y = -1;
    }
    sun_light.position.set(-x, y, -x*1.13);
    if (water) {
      water.material.uniforms.sunDirection.value = sun_light.position.clone().normalize();
    }
  }

  var time = new Date();
  function directorUpdate() {
    // var time = new Date();
    time = new Date(time.getTime() + 200000);
    var today_seed = Math.floor((time.getTime() - 24 * 3600000) / (1000 * 3600 * 24));
    var today_process = (time.getTime() % (1000 * 3600 * 24)) - (10 * 1000 * 3600);
    if (!box_random_gen || box_random_gen.original_seed !== today_seed) {
      box_random_gen = new Math.seededRandomGenerator(today_seed);
    }
    // console.log(time);

    if (today_process < 0) {
      if (box_maze.length != 0) {
        box_maze = box_maze.filter(function (value) {
          maze_container.remove(value.mesh);
          return false;
        });
      }
      if (today_process < (-20 * 60000)) {
        showPoem('comeback');
      } else {
        showPoem('sunset');
      }
      if (today_process < -(6 * 3600000)) {
        // console.log('less: ' + today_process);
        adjustSkyTo(0.8);
        hemiLight.intensity = 0.3;
        sun_light.intensity = 0.3;
      } else {
        hemiLight.intensity = 0.6;
        sun_light.intensity = 0.4;
        // console.log('more: ' + today_process);
        adjustSkyTo(0.50 * (1 - (-today_process) / (6 * 3600000)));
      }
    } else {
      adjustSkyTo(0.50 + 0.50 * (today_process / (12 * 3600000)));

      // Maze
      var maze_should_be = box_max_count * (today_process / (8 * 3600000));
      if (maze_should_be > box_max_count) {
        maze_should_be = box_max_count;
      }
      for (var i = box_maze.length; i < maze_should_be; i++) {
        pushNewBox();
      }

      // Maze opacity
      if(today_process > 10 * 3600000) {
        maze_container.position.y = -1000 * (today_process - 10 * 3600000) / (2 * 3600000);
      } else {
        maze_container.position.y = 0;
      }

      hemiLight.intensity = 0.1;
      sun_light.intensity = 0.1;

      // Poem
      if (today_process < 25 * 60000) {
        showPoem('sunset');
      } else if(today_process < 1.5 * 3600000) {
        showPoem('empty');
      } else if(today_process < 5 * 3600000) {
        showPoem('wayout');
      } else if(today_process < 9.6 * 3600000) {
        showPoem('following');
      } else {
        showPoem(null);
      }
    }
  }


  // help func

  function randomBetween (begin, end) {
    return Math.round(begin + Math.random() * (end - begin));
  }

})(THREE, Detector, window, document);