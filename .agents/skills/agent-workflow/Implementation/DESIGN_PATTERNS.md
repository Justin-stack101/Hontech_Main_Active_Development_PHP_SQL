# Design Patterns Guidelines

## Purpose

Enforce object-oriented design patterns (Creational, Structural, and Behavioral) across the codebase to keep the software architecture modular, flexible, and scalable.

---

## 1. Creational Patterns (Object Creation)

Creational patterns control object instantiation to increase flexibility and reusability.

### Singleton Pattern
- **When to use**: To ensure a class has exactly one instance and provides a global access point to it (e.g. database connection adapters, global settings instances, session managers).
- **Enforcement**:
  - Keep the default constructor private.
  - Implement a static `getInstance()` constructor method that stores and returns a cached static instance of the class.

### Factory Method / Abstract Factory Pattern
- **When to use**: When the code needs to instantiate families of related objects (products) without coupling to their concrete classes.
- **Enforcement**:
  - Define a common interface or abstract class for the products.
  - Implement Creator classes that declare factory methods returning the abstract product interface.

### Builder Pattern
- **When to use**: When creating complex objects that require step-by-step initialization of many optional fields or configurations (e.g. complex SQL Query builders, dynamic Form builder objects).
- **Enforcement**:
  - Extract object construction logic out of the core class and move it to dedicated Builder objects.
  - Allow chaining methods (e.g., `$query->select()->where()->limit()`).

### Prototype Pattern
- **When to use**: When duplicating objects without coupling your code to their concrete classes.
- **Enforcement**:
  - Declare a common cloning interface containing a `clone()` method.

---

## 2. Structural Patterns (Object Composition)

Structural patterns describe how to assemble classes and objects into larger, flexible, and efficient structures.

### Adapter Pattern
- **When to use**: To allow classes with incompatible interfaces to collaborate (e.g., adapting third-party API payload schemas into the internal application interfaces).
- **Enforcement**:
  - Create a middle wrapper Adapter class that implements the client interface and encapsulates the incompatible service.

### Facade Pattern
- **When to use**: To provide a simplified, high-level interface to a complex library, subsystem, or set of classes.
- **Enforcement**:
  - Group calls to complex subsystem operations inside a single, clean class wrapper (Facade) so that client code doesn't get cluttered with subsystem initialization details.

### Proxy Pattern
- **When to use**: To control, cache, or gate access to a resource-intensive object (e.g. lazy-loading query results, managing authorization rules).
- **Enforcement**:
  - Create a proxy class matching the interface of the real service, handling deferred instantiation or access validation before delegating execution to the target object.

---

## 3. Behavioral Patterns (Object Communication)

Behavioral patterns distribute responsibilities and coordinate communication between objects.

### Strategy Pattern
- **When to use**: To define a family of interchangeable algorithms and select which one to execute at runtime (e.g. calculating different branch discount tax structures, switching payment gateways).
- **Enforcement**:
  - Define a common Strategy interface with an execution method.
  - Pass the concrete Strategy object to the Context class constructor or setter, delegating work to it.

### Observer Pattern
- **When to use**: To notify multiple dependent objects automatically when an observed object (publisher) changes its state.
- **Enforcement**:
  - Maintain a list of subscribers inside the publisher class.
  - Implement subscription, unsubscription, and notify methods, communicating only via a common Subscriber interface.
