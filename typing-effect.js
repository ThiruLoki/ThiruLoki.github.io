const element = document.getElementById('typing-effect');
const text = 'Hi, I am Thirumurugan - A ROBOTICS ENGINEER                                                        '; // The text to be typed out
let index = 0;
let typingSpeed = 150; // Typing speed in milliseconds
let deleteSpeed = 75; // Speed of "deleting" the text
let pause = 2000; // Pause time before restarting the typing effect

function typeEffect() {
    if (index < text.length) {
        // Typing out the text
        element.innerHTML += text.charAt(index);
        index++;
        setTimeout(typeEffect, typingSpeed);
    } else {
        // Once the text is complete, wait for a bit then start deleting
        setTimeout(deleteEffect, pause);
    }
}

function deleteEffect() {
    if (index > 0) {
        // "Deleting" the text by reducing its length
        element.innerHTML = text.substring(0, index - 1);
        index--;
        setTimeout(deleteEffect, deleteSpeed);
    } else {
        // Once all text is deleted, restart the typing effect
        typeEffect();
    }
}

// Start the typing effect
typeEffect();



//skills

document.addEventListener('DOMContentLoaded', function() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
            }
        });
    });

    const skillsSection = document.querySelector('.skills-section');
    observer.observe(skillsSection);
});


//footer

document.getElementById('footer').addEventListener('click', function() {
    this.classList.toggle('expanded');
});

// Additional JavaScript to handle the toggle class 'expanded'
// Add corresponding CSS for the .expanded class if needed



//robo

document.getElementById('showRobot').addEventListener('click', function() {
    const robot = document.getElementById('robotPopup');
    robot.classList.toggle('active'); // Toggle the 'active' class to show/hide the robot
});


