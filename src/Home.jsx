import { useState, useEffect } from 'react';
import { 
  ref, 
  push, 
  set, 
  remove, 
  onValue,
  off 
} from 'firebase/database';
import { database, auth } from './firebase/firebase';

const Home = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [filter, setFilter] = useState('all');

  // Load todos from Realtime Database
  useEffect(() => {
    if (!auth.currentUser) return;

    const todosRef = ref(database, `users/${auth.currentUser.uid}/todos`);
    
    const unsubscribe = onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const todosArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by createdAt (most recent first)
        todosArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTodos(todosArray);
      } else {
        // Create initial dummy data if no data exists
        const dummyTodos = {
          [Date.now() + 1]: {
            text: "Complete project documentation",
            completed: false,
            createdAt: new Date().toISOString()
          },
          [Date.now() + 2]: {
            text: "Review code changes",
            completed: true,
            createdAt: new Date().toISOString()
          },
          [Date.now() + 3]: {
            text: "Plan next sprint",
            completed: false,
            createdAt: new Date().toISOString()
          },
          [Date.now() + 4]: {
            text: "Update dependencies",
            completed: false,
            createdAt: new Date().toISOString()
          }
        };
        
        set(todosRef, dummyTodos).catch(error => {
          console.error('Error creating initial todos:', error);
        });
      }
    }, (error) => {
      console.error('Error fetching todos:', error);
    });

    return () => off(todosRef, 'value', unsubscribe);
  }, [auth.currentUser]);

  const addTodo = async () => {
    if (inputValue.trim() !== '' && auth.currentUser) {
      try {
        const todosRef = ref(database, `users/${auth.currentUser.uid}/todos`);
        await push(todosRef, {
          text: inputValue.trim(),
          completed: false,
          createdAt: new Date().toISOString()
        });
        setInputValue('');
      } catch (error) {
        console.error('Error adding todo:', error);
        alert('Failed to add todo. Please try again.');
      }
    }
  };

  const deleteTodo = async (id) => {
    if (auth.currentUser) {
      try {
        const todoRef = ref(database, `users/${auth.currentUser.uid}/todos/${id}`);
        await remove(todoRef);
      } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Failed to delete todo. Please try again.');
      }
    }
  };

  const toggleComplete = async (id) => {
    if (auth.currentUser) {
      try {
        const todo = todos.find(t => t.id === id);
        const todoRef = ref(database, `users/${auth.currentUser.uid}/todos/${id}/completed`);
        await set(todoRef, !todo.completed);
      } catch (error) {
        console.error('Error updating todo:', error);
        alert('Failed to update todo. Please try again.');
      }
    }
  };

  const startEditing = (id, text) => {
    setEditingId(id);
    setEditingText(text);
  };

  const saveEdit = async () => {
    if (editingText.trim() !== '' && auth.currentUser) {
      try {
        const todoRef = ref(database, `users/${auth.currentUser.uid}/todos/${editingId}/text`);
        await set(todoRef, editingText.trim());
      } catch (error) {
        console.error('Error updating todo:', error);
        alert('Failed to update todo. Please try again.');
      }
    }
    setEditingId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const clearCompleted = async () => {
    if (auth.currentUser) {
      try {
        const completedTodos = todos.filter(todo => todo.completed);
        const deletePromises = completedTodos.map(todo => {
          const todoRef = ref(database, `users/${auth.currentUser.uid}/todos/${todo.id}`);
          return remove(todoRef);
        });
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error clearing completed todos:', error);
        alert('Failed to clear completed todos. Please try again.');
      }
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.length - completedCount;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Todo List</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Add Todo Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addTodo}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{todos.length}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{activeCount}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({todos.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'active'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
          {completedCount > 0 && (
            <div className="mt-3 text-center">
              <button
                onClick={clearCompleted}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 text-sm"
              >
                Clear Completed
              </button>
            </div>
          )}
        </div>

        {/* Todo List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {filteredTodos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filter === 'all' && "No tasks yet. Add one above!"}
              {filter === 'active' && "No active tasks. Great job!"}
              {filter === 'completed' && "No completed tasks yet."}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors duration-150 ${
                    todo.completed ? 'bg-gray-50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(todo.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      todo.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {todo.completed && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Todo Content */}
                  <div className="flex-1">
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyPress={handleEditKeyPress}
                        onBlur={saveEdit}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <div
                          className={`font-medium ${
                            todo.completed
                              ? 'line-through text-gray-500'
                              : 'text-gray-800'
                          }`}
                        >
                          {todo.text}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Created: {todo.createdAt}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingId === todo.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors duration-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(todo.id, todo.text)}
                        className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors duration-200"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Built with React & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
