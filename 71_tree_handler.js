"use strict";

// Experimental WIP
// Should replace movelist.js ultimately

function NewTreeHandler() {

	let handler = Object.create(null);

	handler.root = NewTree();
	handler.node = handler.root;

	// Return values of the methods are whether this.node changed.

	handler.new_root_from_board = function(board) {
		DestroyTree(this.root);
		this.root = NewTree(board);
		this.node = this.root;
		return true;
	};

	handler.replace_tree = function(root) {
		DestroyTree(this.root);
		this.root = root;
		this.node = root;
		return true;
	};

	handler.set_node = function(node) {									// node must be in the same tree, or this does nothing
		if (node.get_root() === this.root && node !== this.node) {
			this.node = node;
			return true;
		}
		return false;
	};

	handler.prev = function() {
		if (this.node.parent) {
			this.node = this.node.parent;
			return true;
		}
		return false;
	};

	handler.next = function() {
		if (this.node.children.length > 0) {
			this.node = this.node.children[0];
			return true;
		}
		return false;
	};

	handler.goto_root = function() {
		if (this.node !== this.root) {
			this.node = this.root;
			return true;
		}
		return false;
	};

	handler.goto_end = function() {
		let end = this.node.get_end();
		if (this.node !== end) {
			this.node = end;
			return true;
		}
		return false;
	};

	handler.return_to_main_line = function() {

		let main_line = this.root.future_history();
		let history = this.node.history();

		let node = this.root;

		for (let n = 0; n < history.length; n++) {
			if (main_line[n] !== history[n]) {
				break;
			}
			if (node.children.length === 0) {
				break;
			}
			node = node.children[0];
		}

		if (this.node !== node) {
			this.node = node;
			return true;
		}
		return false;
	};

	handler.promote_to_main_line = function() {

		let node = this.node;
		let changed = false;

		while (node.parent) {
			if (node.parent.children[0] !== node) {
				for (let n = 1; n < node.parent.children.length; n++) {
					if (node.parent.children[n] === node) {
						node.parent.children[n] = node.parent.children[0];
						node.parent.children[0] = node;
						break;
					}
				}
				changed = true;
			}
			node = node.parent;
		}

		if (changed) {
			tree_version++;
		}

		return false;		// this.node never changes here.
	};

	handler.delete_other_lines = function() {

		let changed = this.promote_to_main_line();
		let node = this.root;

		while (node.children.length > 0) {
			if (node.children.length > 1) {
				node.children = node.children.slice(0, 1);
				changed = true;
			}
			node = node.children[0];
		}

		if (changed) {
			tree_version++;
		}

		return false;		// this.node never changes here.
	};

	handler.delete_children = function() {

		if (this.node.children.length > 0) {
			for (let child of this.node.children) {
				child.detach();
			}
			tree_version++;
		}

		return false;		// this.node never changes here.
	};

	handler.delete_node = function() {

		if (!this.node.parent) {
			return this.delete_children();
		}

		let parent = this.node.parent;
		this.node.detach();
		this.node = parent;
		tree_version++;
		return true;
	};

	handler.delete_siblings = function() {

		let changed = false;

		if (this.node.parent) {
			for (let sibling of this.node.parent.children) {
				if (sibling !== this.node) {
					sibling.detach();
					changed = true;
				}
			}
		}

		if (changed) {
			tree_version++;
		}

		return false;		// this.node never changes here.
	};

	handler.make_move = function(s, force_new_node, suppress_draw) {

		// s must be exactly a legal move, including having promotion char iff needed (e.g. e2e1q)

		if (!force_new_node) {
			for (let child of this.node.children) {
				if (child.move === s) {
					this.node = child;
					return true;
				}
			}
		}

		let new_node = NewNode(this.node, s);
		this.node.children.push(new_node);

		this.node = new_node;
		return true;

		// FIXME - use suppress_draw
	};

	handler.make_move_sequence = function(moves) {

		for (let s of moves) {
			this.make_move(s, false, true);
		}

		return true;
	};

	handler.add_move_sequence = function(moves) {

		let node = this.node;

		for (let s of moves) {
			node = node.make_move(s);		// Calling the node's make_move() method, not handler's
		}

		return false;
	};

	handler.get_node_from_move = function(s) {

		for (let child of this.node.children) {
			if (child.move === s) {
				return child;
			}
		}

		throw `get_node_from_move("${s}") - not found`;
	};

	handler.redraw_child = function(node) {

		// Given a child of the current node, redraw it.
		// TODO - FIXME

	};

	handler.handle_click = function(event) {
		alert("TODO");		// TODO - FIXME
		return false;		// FIXME
	};

	return handler;
}



// On the theory that it might help the garbage collector, we can
// destroy trees when we're done with them. Perhaps this is totally
// unnecessary. I've seen it matter in Python.

function DestroyTree(node) {
	__destroy_tree(node.get_root());
}

function __destroy_tree(node) {

	// Non-recursive when possible...

	while (node.children.length === 1) {

		let child = node.children[0];

		node.parent = null;
		node.__position = null;
		node.children = null;
		node.destroyed = true;

		node = child;
	}

	// Recursive when necessary...

	let children = node.children;

	node.parent = null;
	node.__position = null;
	node.children = null;
	node.destroyed = true;

	for (let child of children) {
		__destroy_tree(child);
	}
}
