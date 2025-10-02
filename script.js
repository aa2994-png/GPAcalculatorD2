// Data Layer: Course data structure and storage
class GPADataLayer {
    constructor() {
        this.courses = this.loadFromStorage();
    }

    // Load courses from localStorage
    loadFromStorage() {
        const stored = localStorage.getItem('gpaCalculatorCourses');
        return stored ? JSON.parse(stored) : [];
    }

    // Save courses to localStorage
    saveToStorage() {
        localStorage.setItem('gpaCalculatorCourses', JSON.stringify(this.courses));
    }

    // Add a new course
    addCourse(course) {
        this.courses.push(course);
        this.saveToStorage();
    }

    // Remove a course by index
    removeCourse(index) {
        this.courses.splice(index, 1);
        this.saveToStorage();
    }

    // Clear all courses
    clearAllCourses() {
        this.courses = [];
        this.saveToStorage();
    }

    // Get all courses
    getAllCourses() {
        return this.courses;
    }
}

// Processing Layer: GPA calculation logic
class GPAProcessor {
    // Grade point mapping
    static gradePoints = {
        '4.0': 4.0, '3.7': 3.7, '3.3': 3.3, '3.0': 3.0,
        '2.7': 2.7, '2.3': 2.3, '2.0': 2.0, '1.7': 1.7,
        '1.3': 1.3, '1.0': 1.0, '0.0': 0.0
    };

    // Calculate GPA from courses
    static calculateGPA(courses) {
        if (courses.length === 0) {
            return {
                gpa: 0,
                totalCredits: 0,
                totalPoints: 0,
                courseCount: 0
            };
        }

        let totalCredits = 0;
        let totalPoints = 0;

        courses.forEach(course => {
            const credits = parseFloat(course.credits);
            const gradePoint = parseFloat(course.grade);
            
            totalCredits += credits;
            totalPoints += credits * gradePoint;
        });

        const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

        return {
            gpa: gpa.toFixed(2),
            totalCredits: totalCredits,
            totalPoints: totalPoints.toFixed(2),
            courseCount: courses.length
        };
    }

    // Validate course data
    static validateCourse(name, credits, grade) {
        const errors = [];

        if (!name.trim()) {
            errors.push('Course name is required');
        }

        if (isNaN(credits) || credits <= 0) {
            errors.push('Credits must be a positive number');
        }

        if (!this.gradePoints.hasOwnProperty(grade)) {
            errors.push('Invalid grade selected');
        }

        return errors;
    }
}

// User Interface Layer: DOM manipulation and event handling
class GPAUI {
    constructor(dataLayer, processor) {
        this.dataLayer = dataLayer;
        this.processor = processor;
        this.initializeEventListeners();
        this.renderCourses();
        this.updateResults();
    }

    initializeEventListeners() {
        // Add course button
        document.getElementById('addCourse').addEventListener('click', () => {
            this.addCourseHandler();
        });

        // Clear all courses button
        document.getElementById('clearAll').addEventListener('click', () => {
            this.clearAllCoursesHandler();
        });

        // Save data button
        document.getElementById('saveData').addEventListener('click', () => {
            this.saveDataHandler();
        });

        // Enter key support for form
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCourseHandler();
            }
        });
    }

    addCourseHandler() {
        const nameInput = document.getElementById('courseName');
        const creditsInput = document.getElementById('courseCredits');
        const gradeInput = document.getElementById('courseGrade');

        const name = nameInput.value.trim();
        const credits = parseFloat(creditsInput.value);
        const grade = gradeInput.value;

        // Validate input
        const errors = this.processor.validateCourse(name, credits, grade);
        
        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }

        // Add course to data layer
        this.dataLayer.addCourse({ name, credits, grade });

        // Clear form and update UI
        nameInput.value = '';
        creditsInput.value = '3';
        this.renderCourses();
        this.updateResults();

        // Focus back on course name
        nameInput.focus();
    }

    removeCourseHandler(index) {
        this.dataLayer.removeCourse(index);
        this.renderCourses();
        this.updateResults();
    }

    clearAllCoursesHandler() {
        if (confirm('Are you sure you want to clear all courses?')) {
            this.dataLayer.clearAllCourses();
            this.renderCourses();
            this.updateResults();
        }
    }

    saveDataHandler() {
        this.dataLayer.saveToStorage();
        alert('Data saved successfully!');
    }

    renderCourses() {
        const coursesList = document.getElementById('coursesList');
        const courses = this.dataLayer.getAllCourses();

        if (courses.length === 0) {
            coursesList.innerHTML = `
                <div class="empty-state">
                    <p>No courses added yet. Add your first course above!</p>
                </div>
            `;
            return;
        }

        coursesList.innerHTML = courses.map((course, index) => `
            <div class="course-item">
                <div class="course-info">
                    <div class="course-name">${this.escapeHtml(course.name)}</div>
                    <div class="course-details">
                        ${course.credits} credits • Grade: ${this.getGradeLabel(course.grade)}
                    </div>
                </div>
                <button class="btn-danger" onclick="gpaUI.removeCourseHandler(${index})">
                    Remove
                </button>
            </div>
        `).join('');
    }

    updateResults() {
        const courses = this.dataLayer.getAllCourses();
        const results = this.processor.calculateGPA(courses);

        document.getElementById('gpaValue').textContent = results.gpa;
        document.getElementById('totalCredits').textContent = results.totalCredits;
        document.getElementById('totalPoints').textContent = results.totalPoints;
        document.getElementById('courseCount').textContent = results.courseCount;

        // Update GPA color based on value
        this.updateGPAColor(results.gpa);
    }

    updateGPAColor(gpa) {
        const gpaValue = document.getElementById('gpaValue');
        gpaValue.className = 'gpa-value';
        
        if (gpa >= 3.7) {
            gpaValue.classList.add('excellent');
        } else if (gpa >= 3.0) {
            gpaValue.classList.add('good');
        } else if (gpa >= 2.0) {
            gpaValue.classList.add('average');
        } else {
            gpaValue.classList.add('poor');
        }
    }

    getGradeLabel(gradeValue) {
        const gradeLabels = {
            '4.0': 'A', '3.7': 'A-', '3.3': 'B+', '3.0': 'B',
            '2.7': 'B-', '2.3': 'C+', '2.0': 'C', '1.7': 'C-',
            '1.3': 'D+', '1.0': 'D', '0.0': 'F'
        };
        return gradeLabels[gradeValue] || 'Unknown';
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Add GPA color styles dynamically
const style = document.createElement('style');
style.textContent = `
    .gpa-value.excellent { color: #48bb78; }
    .gpa-value.good { color: #68d391; }
    .gpa-value.average { color: #f6e05e; }
    .gpa-value.poor { color: #fc8181; }
`;
document.head.appendChild(style);

// Initialize the application
const dataLayer = new GPADataLayer();
const gpaUI = new GPAUI(dataLayer, GPAProcessor);

// Make gpaUI globally available for onclick handlers
window.gpaUI = gpaUI;
