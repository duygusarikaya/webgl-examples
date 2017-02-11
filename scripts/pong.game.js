
/**
Based on the tutorial http://buildnewgames.com/webgl-threejs/
**/
var scene;
var camera;
var renderer;

var plane;
var planeWidth = 620;
var planeHeight = 320;

var paddleWidth = 10;
var paddleHeight = 30;
var paddleDepth = 10;

var paddle1;
var paddle2;
var paddleDirection1;
var paddleDirection2;
var paddleSpeedConstant = 1;
var aiQuotient = 0.2; 

var score1 = 0;
var score2 = 0;
var maxScore = 7;

var ball;
var ballBoundingBox;
var ballSpeedConstant = 1;
var ballDirectionX = 1;
var ballDirectionY = 1;

function createRenderer() {
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x000000, 1.0); //black
	//renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setSize(planeWidth, planeHeight);
	renderer.shadowMap.enabled = true;
}

function createCamera() {
	camera = new THREE.PerspectiveCamera(
		45,										//field of view
		//window.innerWidth / window.innerHeight,	//aspect ratio
		planeWidth / planeHeight,
		0.1, 1000);								//far & near clip planes

	camera.position.z = 480;
	camera.lookAt(scene.position);
	//scene.add(camera);
}

function createSphere() {
	var sphereGeometry = new THREE.SphereGeometry(5, 30, 30);
	var sphereMaterial = new THREE.MeshPhongMaterial({
		color: "red"
	});
	ball = new THREE.Mesh(sphereGeometry, sphereMaterial);
	ball.geometry.computeBoundingBox();
	ballBoundingBox = new THREE.Box3(ball.geometry.boundingBox.min, ball.geometry.boundingBox.max);

	ball.castShadow = true;
	ball.position.z = 5;

	scene.add(ball);
}

function createLight() {
	var directionalLight = new THREE.DirectionalLight(0xffffff, 1); //white
	directionalLight.position.set(-100, 50, 250);
	directionalLight.name = 'directional';

	scene.add(directionalLight);

}

function createPlane()  {
	var planeGeometry = new THREE.PlaneGeometry(planeWidth * 0.95, planeHeight);
	var planeMaterial = new THREE.MeshPhongMaterial({
		//color: 0x6FDA4D
		color: 'black'
	});
	var plane = new THREE.Mesh(planeGeometry, planeMaterial);

	plane.receiveShadow = true;

	scene.add(plane);
}

function createTable()  {
	/**
	var tableHollowGeometry = new THREE.PlaneGeometry(650, 320);
	var tableHollowMaterial = new THREE.MeshLambertMaterial({
		color: 'black'
	});
	var tableHollow = new THREE.Mesh(tableHollowGeometry, tableHollowMaterial);

	tableHollow.receiveShadow = true;
	tableHollow.position.z = -11; 
	**/

	var tableGeometry = new THREE.CubeGeometry(planeWidth * 1.05, planeHeight * 1.03, 100);

	var tableMaterial = new THREE.MeshPhongMaterial({
		//map: texture
		color: 'brown'
	});
	var table = new THREE.Mesh(tableGeometry, tableMaterial);

	table.receiveShadow = true;
	table.position.z = -51; 

	//scene.add(tableHollow);
	scene.add(table);
}

function createFloor()  {
	var planeGeometry = new THREE.CubeGeometry(1000, 1000, 5);

	var planeMaterial = new THREE.MeshLambertMaterial({
		//map: texture
		color: 0x444444
	});
	var ground = new THREE.Mesh(planeGeometry, planeMaterial);

	ground.receiveShadow = true;
	ground.position.z = -90; 

	scene.add(ground);
}

function createPaddles() { 
	
	var paddleMaterial1 = new THREE.MeshLambertMaterial({
			color: 0x3333ff
		});

	var paddleMaterial2 = new THREE.MeshLambertMaterial({
			color: 'orange'
		});

	var paddleGeometry = new THREE.CubeGeometry(paddleWidth, paddleHeight, paddleDepth);

	paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial1);
	paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial2);

	// set paddle positions
	paddle1.position.x = -planeWidth / 2 + paddleWidth;
	paddle2.position.x = planeWidth / 2 - paddleWidth;

	paddle1.receiveShadow = true;
	paddle1.castShadow = true; 
	paddle2.receiveShadow = true;
	paddle2.castShadow = true; 

	// elevate paddles over the plane
	paddle1.position.z = paddleDepth;
	paddle2.position.z = paddleDepth;

	//name paddles
	paddle1.name = "1";
	paddle2.name = "2";

	// add the paddles to the scene
	scene.add(paddle1);
	scene.add(paddle2);
}


function init() {

	scene = new THREE.Scene();

	createSphere();
	createLight();

	createPlane();
	createPaddles();
	createTable();
	createFloor();

	createRenderer();
	createCamera();

	var gameCanvas = document.getElementById("gameCanvas");
	if(gameCanvas != null)
		gameCanvas.appendChild(renderer.domElement);

	render();
}

function render() {

	renderer.render(scene, camera);
	requestAnimationFrame(render); //browser calls render() for each redraw

	//change camera position 
	///**
	camera.position.x = paddle1.position.x - 180;
	camera.position.z = paddle1.position.z + 150;
	camera.rotation.z = - 90 * Math.PI / 180;
	camera.rotation.y = - 60 * Math.PI / 180;
	//**/

	//game logic
	moveBall();
	movePaddle1(); //player
	movePaddle2(); //cpu
	detectPaddleBallCollision(paddle1);
	detectPaddleBallCollision(paddle2);
}

function moveBall() {

	var scored = false;
	//scoring
	if (ball.position.x <= - planeWidth / 2) { //cpu scores
		score2 += 1; 
		resetBallFor(2);
		scored = true;
	}
	if (ball.position.x >= planeWidth / 2) { //player scores
		score1 += 1; 
		resetBallFor(1);
		scored = true;
	}

	if(scored) {
		scored = false;
		document.getElementById("scores").innerHTML = score1 + "-" + score2;
		checkScore();
	}

	//bounce the ball from the sides
	if (ball.position.y <= - planeHeight / 2) { ballDirectionY *= -1; }
	if (ball.position.y >= planeHeight / 2) { ballDirectionY *= -1; }

	//limit ball speed
	ballDirectionX = Math.min(ballDirectionX, ballSpeedConstant * 2);
	ballDirectionY = Math.min(ballDirectionY, ballSpeedConstant * 2);

	//move ball
	ball.position.x += ballDirectionX * ballSpeedConstant;
	ball.position.y += ballDirectionY * ballSpeedConstant;
}

function movePaddle1() {
	if((Key.isDown(Key.A) || Key.isDown(Key.left)) && (paddle1.position.y < planeHeight / 2 - paddleHeight/2)) { 
		paddleDirection1 = 1;
		paddle1.position.y += paddleSpeedConstant; 
	} else if ((Key.isDown(Key.D) || Key.isDown(Key.right)) && (paddle1.position.y - paddleHeight/2 > - planeHeight / 2 )) { 
		paddleDirection1 = -1;
		paddle1.position.y -= paddleSpeedConstant;
	} 
}

//pong AI that follows the ball
function movePaddle2() {
	var positionDiffY = (ball.position.y - paddle2.position.y) * aiQuotient;
	if(positionDiffY > paddleSpeedConstant) {
		paddleDirection2 = 1;
		paddle2.position.y += Math.min(paddleSpeedConstant, Math.abs(positionDiffY));
	} else if (positionDiffY < -paddleSpeedConstant) {
		paddleDirection2 = -1;
		paddle2.position.y -= Math.min(paddleSpeedConstant, Math.abs(positionDiffY));
	}
}

function detectPaddleBallCollision(paddle) {
	if(ball.position.x <= paddle.position.x + paddleWidth && 
		ball.position.x >= paddle.position.x &&
		ball.position.y <= paddle.position.y + paddleHeight/2 &&
		ball.position.y >= paddle.position.y - paddleHeight/2) 
	{
		//reverse
		ballDirectionX *= -1;
		if (paddle.name == "1") {
			ballDirectionY += paddleDirection1 * 0.5;
		} else {
			ballDirectionY += paddleDirection2 * 0.5;
		}
		
	}
}

function resetBallFor(player) {
	ball.position.x = 0;
	ball.position.y = 0;

	ballDirectionY = 1;
	if (player == 1) {
		ballDirectionX = -1;
	} else {
		ballDirectionX = 1;
	}
}

function checkScore() {
	if (maxScore == Math.max(score1, score2)) {
		ballSpeedConstant = 0;
		document.getElementById("gameInfo").innerHTML = "Refresh to play again";

		if(score1 > score2) {
			document.getElementById("scores").innerHTML = "You won!";
		} else {
			document.getElementById("scores").innerHTML = "You lost!";
		}
	}
}

init();
