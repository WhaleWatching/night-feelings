
  function addSkybox () {
    // Sky box

    var cube_map = new THREE.CubeTexture([]);
    cube_map.format = THREE.RGBFormat;

    var loader = new THREE.TextureLoader();
    loader.load('textures/skyboxsun25degtest.png', function (texture) {
      console.dir(texture.image);

      function getSide (x, y) {
        var size = 1024;

        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        var context = canvas.getContext('2d');
        context.drawImage(texture.image, - x * size, - y * size);

        return canvas;
      }

      cube_map.images[ 0 ] = getSide( 2, 1 ); // px
      cube_map.images[ 1 ] = getSide( 0, 1 ); // nx
      cube_map.images[ 2 ] = getSide( 1, 0 ); // py
      cube_map.images[ 3 ] = getSide( 1, 2 ); // ny
      cube_map.images[ 4 ] = getSide( 1, 1 ); // pz
      cube_map.images[ 5 ] = getSide( 3, 1 ); // nz
      cube_map.needsUpdate = true;
    });

    var cube_shader = THREE.ShaderLib['cube'];
    cube_shader.uniforms['tCube'].value = cube_map;

    var skyBoxMaterial = new THREE.ShaderMaterial({
      fragmentShader: cube_shader.fragmentShader,
      vertexShader: cube_shader.vertexShader,
      uniforms: cube_shader.uniforms,
      depthWrite: true,
      side: THREE.BackSide
    });

    var sky_box = new THREE.Mesh(
        new THREE.BoxGeometry(1000000, 1000000, 1000000),
        skyBoxMaterial
      );

    scene.add(sky_box);
  }