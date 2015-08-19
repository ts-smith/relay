import AddTodoMutation from '../mutations/AddTodoMutation';
import TodoList from './TodoList';
import TodoListFooter from './TodoListFooter';
import TodoTextInput from './TodoTextInput';

class TodoApp extends React.Component {
  _handleTextInputSave = (text) => {
    Relay.Store.update(
      new AddTodoMutation({text, viewer: this.props.viewer})
    );
  }
  showMore = () => {
    var first = this.props.relay.variables.first;
    this.props.relay.setVariables({first: first + 1});
  }
  render() {
    var hasTodos = this.props.viewer.todos.totalCount > 0;

    var edges = this.props.viewer.todos;

    console.log('parent', edges.__dataID__);

    return (
      <div>
        <section className="todoapp">
          <header className="header">
            <h1 onClick={this.showMore}>
              show more
            </h1>
            <TodoTextInput
              autoFocus={true}
              className="new-todo"
              onSave={this._handleTextInputSave}
              placeholder="What needs to be done?"
            />
          </header>
          {hasTodos &&
            <TodoList
              todos={this.props.viewer.todos}
              viewer={this.props.viewer}
            />
          }
          {hasTodos &&
            <TodoListFooter
              todos={this.props.viewer.todos}
              viewer={this.props.viewer}
            />
          }
        </section>
        <footer className="info">
          <p>
            Double-click to edit a todo
          </p>
          <p>
            Created by the <a href="https://facebook.github.io/relay/">
              Relay team
            </a>
          </p>
          <p>
            Part of <a href="http://todomvc.com">TodoMVC</a>
          </p>
        </footer>
      </div>
    );
  }
}

export default Relay.createContainer(TodoApp, {
  initialVariables: {
    first: 1
  },
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        todos(first: $first) {
          edges {
            node {
              id,
            },
          },
          totalCount,
          ${TodoList.getFragment('todos')},
          ${TodoListFooter.getFragment('todos')},
        },
        ${AddTodoMutation.getFragment('viewer')},
        ${TodoList.getFragment('viewer')},
        ${TodoListFooter.getFragment('viewer')},
      }
    `,
  },
});
