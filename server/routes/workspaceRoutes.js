import express from 'express';
import { tasksDB } from '../db/dataStore.js';

const router = express.Router();

// GET /api/workspace/tasks - Fetch all Kanban tasks
router.get('/tasks', async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const { query } = await import('../db/postgres.js');
      const dbRes = await query('SELECT * FROM tasks ORDER BY id ASC');
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        const sqlTasks = dbRes.rows.map(t => ({
          id: t.id,
          title: t.title,
          desc: t.desc_text || '',
          priority: t.priority || 'Medium',
          column: t.column_id || 'backlog',
          comments: Number(t.comments || 0),
          date: t.task_date || 'Oct 24'
        }));
        return res.status(200).json({
          success: true,
          total: sqlTasks.length,
          source: 'Supabase PostgreSQL Cloud Database',
          tasks: sqlTasks
        });
      }
    }
  } catch (err) {
    console.warn('Workspace tasks SQL query fallback:', err.message);
  }

  return res.status(200).json({
    success: true,
    total: tasksDB.length,
    source: 'Application State',
    tasks: tasksDB
  });
});

// POST /api/workspace/tasks - Create Task
router.post('/tasks', (req, res) => {
  const { title, desc, column, priority, date } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Task title is required.' });
  }

  const newTask = {
    id: Date.now(),
    title: title.trim(),
    desc: desc ? desc.trim() : 'Task deliverable item.',
    priority: priority || 'Medium',
    column: column || 'backlog',
    comments: 0,
    date: date || 'Oct 28'
  };

  tasksDB.push(newTask);

  return res.status(201).json({
    success: true,
    message: 'Task created successfully.',
    task: newTask
  });
});

// PUT /api/workspace/tasks/:id - Move or Update Task Column
router.put('/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const { column, priority, title, desc } = req.body;

  const taskIndex = tasksDB.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  if (column) tasksDB[taskIndex].column = column;
  if (priority) tasksDB[taskIndex].priority = priority;
  if (title) tasksDB[taskIndex].title = title;
  if (desc) tasksDB[taskIndex].desc = desc;

  return res.status(200).json({
    success: true,
    message: 'Task updated successfully.',
    task: tasksDB[taskIndex]
  });
});

// DELETE /api/workspace/tasks/:id - Delete Task
router.delete('/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const taskIndex = tasksDB.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  const deletedTask = tasksDB.splice(taskIndex, 1);

  return res.status(200).json({
    success: true,
    message: 'Task deleted successfully.',
    task: deletedTask[0]
  });
});

// GET /api/workspace/export-csv - Generate & Download Workspace Summary CSV
router.get('/export-csv', (req, res) => {
  const headers = 'ID,Title,Description,Priority,Column,Comments,Date\n';
  const rows = tasksDB.map(t => 
    `"${t.id}","${(t.title || '').replace(/"/g, '""')}","${(t.desc || '').replace(/"/g, '""')}","${t.priority}","${t.column}",${t.comments || 0},"${t.date || ''}"`
  ).join('\n');
  
  const csvContent = headers + rows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="unicollab_workspace_tasks.csv"');
  return res.status(200).send(csvContent);
});

export default router;
