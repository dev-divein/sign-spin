import rive from 'https://esm.sh/@rive-app/canvas@2.11.1';
import camelCase from 'https://esm.sh/camelcase@8.0.0';

const APPROACH_DISTANCE = 400;
const CANVAS_BTN_RATIO = 331 / 165;
const CANVAS_HEIGHT_RATIO = 331 / 322;

const btn = document.querySelector('.btn-cta');
const btnPoint = btn.getBoundingClientRect();

const state = {
  approaching: false,
  isHidden: true,
  isIdle: false,
};

let triggers = {};
let lookAtMe = [];

const container = createContainer();
const riveCanvas = createCanvas();

setupRive();

// listening for when the state changes
// and triggering the animations
const stateProxy = new Proxy(state, {
  set: function (target, key, value) {
    if (target[key] !== value) {
      target[key] = value;

      if (isReadyForAnimation(key)) {
        getRandomAnimation().fire();
        target.isIdle = false;
      }
    } 

    return true;
  }
});

// Figure out how far the mouse is from the button
// if less than the approaching distance, set the state to approaching
document.addEventListener('mousemove', (event) => {
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  const distance = Math.hypot(mouseX - btnPoint.x, mouseY - btnPoint.y);

  if (distance <= APPROACH_DISTANCE) {
    stateProxy.approaching = true;
  } else {
    stateProxy.approaching = false;

  }
});


function setupRive() {
  const layout = new rive.Layout({
    fit: rive.Fit.Contain,
    alignment: rive.Alignment.BottomLeft,
  });

  const instance = new rive.Rive({
    src: "sign_flipping.riv",
    stateMachines: "State Machine 1",
    canvas: riveCanvas,
    layout,
    autoplay: true,
    onLoad: () => riveOnLoad(instance),
  });


  // events are fired when the animation changes state  (e.g. from idle to hidden)
  instance.on(rive.EventType.RiveEvent, handleRiveEvent);

  // Resize the drawing surface if the window resizes
  window.addEventListener(
    "resize",
    () => {
      instance.resizeDrawingSurfaceToCanvas();
    },
    false
  );
}


/**
 * Once the rive animation is loaded, extract the triggers
 * from the state machine and store them in the triggers object
 * @param {Rive} instance
 */
function riveOnLoad(instance) {

  const inputs = instance.stateMachineInputs("State Machine 1");
  inputs.forEach((input) => {
    const camelCaseName = camelCase(input.name)

    triggers[camelCaseName] = input;
  });

  // triggers that will be randomly selected
  lookAtMe = [triggers.spinSign, triggers.rotateSign, triggers.pointSign];

  // Prevent a blurry canvas by using the device pixel ratio
  instance.resizeDrawingSurfaceToCanvas();

  // start checking if the character should be visible or not.
  checkVisibility();

}

/**
 * Updates the state based on the rive event
 * @param {RiveEvent} event
 */
function handleRiveEvent({ data }) {
  // Rive animation is at the idle state
  if (data.name === 'Idle') {
    stateProxy.isIdle = true;
    stateProxy.isHidden = false;

    // Rive animation is at the hidden state
  } else if (data.name === 'hidden') {
    stateProxy.isHidden = true;
    stateProxy.isIdle = false;
  }
}

function getRandomAnimation() {
  return lookAtMe[Math.floor(Math.random() * lookAtMe.length)];
}

function isReadyForAnimation(key) {
  return key === 'isIdle' && state.isIdle && state.approaching;
}

/**
 * Checks if the character should be visible or not
 * and triggers the appropriate animation
 */
function checkVisibility() {
  if (shouldBeHidden()) {
    triggers.hide.fire();
  } else if (shouldBeVisible()) {
    triggers.emerge.fire();
  }

  requestAnimationFrame(checkVisibility);
}

function shouldBeVisible() {
  return state.approaching && state.isHidden;
}

function shouldBeHidden() {
  return state.isIdle && !state.approaching;
}

function createCanvas() {
  const riveCanvas = document.createElement('canvas');
  riveCanvas.id = 'rive-canvas';
  riveCanvas.style.position = 'absolute';
  riveCanvas.style.width = Math.floor(btnPoint.width * .8 * CANVAS_BTN_RATIO) + 'px';
  riveCanvas.style.height = Math.floor((btnPoint.width * .8 * CANVAS_BTN_RATIO) / CANVAS_HEIGHT_RATIO) + 'px';
  riveCanvas.style.bottom = '0';
  riveCanvas.style.left = '-30%';
  riveCanvas.style.zIndex = '-1';
  container.appendChild(riveCanvas);
  return riveCanvas;
}

function createContainer() {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.zIndex = '1';
  btn.parentElement.insertBefore(container, btn);
  container.appendChild(btn);
  return container;
}


