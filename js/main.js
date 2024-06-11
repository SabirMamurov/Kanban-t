Vue.component('add-task', {
    template: `
    <div>
    <p v-if="errors.length">
        <b>Please correct the following error(s):</b>
        <ul>
            <li v-for="error in errors">{{ error }}</li>
        </ul>
    </p>
        <h2>Create task</h2>
        <div>
        <label>Task title: <br>
         <input placeholder="New task" v-model="task.title">
         </label>
        <h3>Tasks</h3>
        <div v-for="(subtask, index) in task.subtasks"><textarea placeholder="Description" v-model="subtask.title" :key="index"></textarea>
        </div>
        <div>
    <input type="radio" id="yes" name="drone" v-model="task.importance" value="1"/>
    <label for="yes">Important</label>
  </div>

  <div>
    <input type="radio" id="no" name="drone" v-model="task.importance" value="0" />
    <label for="no">Common</label>
  </div>
  <input type="date" v-model="task.deadline_date">
        <button @click="addTask">add</button>
        </div>
    </div>
    `,
    methods: {
        addTask() {
            this.errors = [];
            if (!this.task.title || this.task.subtasks.filter(subtask => subtask.title).length === 0 || !this.task.deadline_date) {
                if (!this.task.title) this.errors.push("Title required.");
                if (this.task.subtasks.filter(subtask => subtask.title).length === 0) this.errors.push("You must have description.");
                if (!this.task.deadline_date) this.errors.push("Deadline required.");
                return;
            }
            let productReview = {
                title: this.task.title,
                subtasks: this.task.subtasks.filter(subtask => subtask.title),
                date: this.task.date,
                time: this.task.time,
                importance: this.task.importance,
                deadline_date: this.task.deadline_date
            };
            this.$emit('add-task', productReview);
            location.reload()
        },
    },
    data() {
        return {
            errors: [],
            task: {
                title: 'New task',
                subtasks: [
                    {title: ""},
                ],
                importance: 1,
                deadline_date: '',
                time: new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds(),
                date: new Date().getFullYear() + '-' + (new Date().getMonth()+1) + '-' + new Date().getDate(),
            }
        }
    },
})

Vue.component('column', {
    props: {
        column: {
            title: '',
            tasks: [],
            date: '',
            deadline_date: '',
        }
    },
    template: `
        <div class="column" @dragover.prevent @drop="dropTask">
    <div class="column">
        <h2>{{column.title}}</h2>
        <div class="task">
        <task v-for="(task, index) in sortedTasks"
        :key="index"
        :task="task"
        @del-task="delTask"
        @move-task="move"
        @move-task2="move2"
        @drop-task="dropTask"
        @update-task="updateTask">
        
    </task>
        </div>
    </div>
    </div>
    `,
    updated() {
        this.$emit('save')
    },
    methods: {
        dropTask(event) {
            const taskData = JSON.parse(event.dataTransfer.getData('task'));
            this.$emit('drop-task', { taskData, column: this.column });
        },
        move(task) {
            this.$emit('move-task', { task, column: this.column });
        },
        move2(task) {
            this.$emit('move-task2', { task, column: this.column });
        },
        delTask(task){
            this.$emit('del-task', task);
        },
        updateTask(task) {
            this.$emit('save');
        },
    },
    computed: {
        sortedTasks() {
            return this.column.tasks.sort((a, b) => b.importance - a.importance);
        },
    }
})

Vue.component('task', {
    props: {
        task: {
            title: '',
            subtasks: [],
            importance: '',
            returnReason: []
        }
    },
    template: `
        <div :class="{task2: isFirstColumn}" draggable="true" @dragstart="dragStart">
        <h2 v-if="!task.isEditing">{{ task.title }}</h2>
        <input v-if="task.isEditing" v-model="task.title" placeholder="Task title" />
        <p v-for="(subtask, index) in task.subtasks" class="subtask" :key="index">
            <span v-if="!task.isEditing">{{ subtask.title }}</span>
            <textarea v-if="task.isEditing" v-model="subtask.title" placeholder="Subtask description"></textarea>
        </p>
        <p>Дата изменения: {{ task.time }} - {{ task.date }}</p>
        <p>Предпологаемая дата сдачи: {{ task.deadline_date }}</p>
        <p v-if="task.importance === 1">important</p>
        <p v-else>Common</p>
        <div v-if="!isLastColumn">
            <button v-if="isFirstColumn" @click="delTask">Delete task</button>
            <div v-if="this.$parent.column.index !== 2">
                <button @click="move2"><--</button>
            </div>
            <div v-if="this.$parent.column.index === 2">
                <button @click="returnToActive"><--</button>
            </div>
            <button @click="move">--></button>
            <div v-if="this.$parent.column.index === 1">
                <p v-if="task.returnReason !== '' ">{{ task.returnReason }}</p>
            </div>
            <button @click="toggleEditing">{{ task.isEditing ? 'Save' : 'Edit' }}</button>
        </div>
        <div v-if="isLastColumn">
            <p v-if="isTaskOverdue">Expired</p>
            <p v-else>Done in time</p>
        </div>
    </div>
    `,
    methods: {
        dragStart(event) {
            event.dataTransfer.setData('task', JSON.stringify(this.task));
        },
        toggleEditing() {
            this.task.isEditing = !this.task.isEditing;
            this.task.time = new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
            this.task.date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
            this.$emit('update-task', this.task);
            location.reload()
            localStorage.setItem('task_' + this.task.title + '_isEditing', this.task.isEditing);
        },
        returnToActive() {
            const reason = prompt("Please enter the reason for returning the task:");
            if (reason) {
                if (!this.task.returnReason) {
                    this.$set(this.task, 'returnReason', []);
                }
                this.task.returnReason.push(reason);
                this.$emit('move-task2', { task: this.task, column: this.$parent.column });
            }
        },
        delTask(task){
            this.$emit('del-task', task);
        },
        move() {
            this.$emit('move-task', { task: this.task, column: this.$parent.column });
        },
        move2() {
            this.$emit('move-task2', { task: this.task, column: this.$parent.column });
        },
    },
    computed: {
        isLastColumn() {
            return this.$parent.column.index === 3;
        },
        isFirstColumn() {
            return this.$parent.column.index === 0;
        },
        isTaskOverdue() {
            return new Date(this.task.date) > new Date(this.task.deadline_date);
        },
    }
})

let app = new Vue({
    el: '#app',
    data: {
        columns: [
            {
                index: 0,
                title: "Planned tasks",
                tasks: [],
            },
            {
                index: 1,
                title: "Active",
                tasks: []
            },
            {
                index: 2,
                title: "Testing",
                tasks: [],
            },
            {
                index: 3,
                title: "Complete",
                tasks: [],
                expired: false
            },
        ]
    },
    mounted() {
        if (!localStorage.getItem('columns')) return
        this.columns = JSON.parse(localStorage.getItem('columns'));

        this.columns.forEach(column => {
            column.tasks.forEach(task => {
                const isEditing = localStorage.getItem('task_' + task.title + '_isEditing');
                if (isEditing !== null) {
                    task.isEditing = JSON.parse(isEditing);
                }
            });
        });
    },
    methods: {
        returnToActive(task,column) {
            const reason = prompt("Please enter the reason for returning the task:");
            if (reason) {
                if (!task.returnReason) {
                    this.$set(task, 'returnReason', []);
                }
                task.returnReason.push(reason);
                this.$emit('move-task2', { task: task, column: column });
            }
        },
        dropTask({ taskData, column }) {
            const currentColumn = this.columns.find(col => col === column);
            const currentIndex = this.columns.findIndex(col => col === column);
            if (currentIndex > 0) {
                const previousColumn = this.columns[currentIndex - 1];
                let taskIndex = -1;

                for (let i = 0; i < previousColumn.tasks.length; i++) {
                    if (previousColumn.tasks[i].title === taskData.title) {
                        taskIndex = i;
                        break;
                    }
                }

                if (taskIndex !== -1) {
                    previousColumn.tasks.splice(taskIndex, 1);
                    currentColumn.tasks.push(taskData);
                    this.save();
                } else {
                    const nextColumn = this.columns[currentIndex + 1];
                    taskIndex = nextColumn.tasks.findIndex(task => task.title === taskData.title);
                    if (currentIndex !== 2) {
                        if (taskIndex !== -1) {
                            nextColumn.tasks.splice(taskIndex, 1);
                            currentColumn.tasks.push(taskData);
                            this.returnToActive(taskData);
                            this.save();
                        }
                    }
                }
            }
        },
        save() {
            localStorage.setItem('columns', JSON.stringify(this.columns))
        },
        addTask(task) {
            if ((this.columns[0].tasks.length > 2) || this.columns[0].disabled) return
            this.columns[0].tasks.push(task)
        },

        delTask(task){
            this.columns[0].tasks.splice(task,1)
        },
        move(data) {
            if (data.column.index === 2 && new Date(data.task.task.date) > new Date(data.task.task.deadline_date)) {
                data.task.column.expired = true;
            }
            data.task.task.time = new Date().getHours() + ':' + new Date().getMinutes() + ':' +new Date().getSeconds()
            data.task.task.date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
            const fromColumn = this.columns[data.column.index];
            const toColumn = this.columns[data.column.index + 1];
            if (toColumn) {
                toColumn.tasks.push(fromColumn.tasks.splice(fromColumn.tasks.indexOf(data.task), 1)[0]);
                this.save();
            }
        },
        move2(data) {
            data.task.task.time = new Date().getHours() + ':' + new Date().getMinutes() + ':' +new Date().getSeconds()
            data.task.task.date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
            const fromColumn = this.columns[data.column.index];
            const toColumn = this.columns[data.column.index - 1];
            if (toColumn) {
                toColumn.tasks.push(fromColumn.tasks.splice(fromColumn.tasks.indexOf(data.task), 1)[0]);
                this.save();
            }
        },
    },
})