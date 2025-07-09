# Advanced Development Patterns

This guide covers sophisticated development patterns and best practices for building robust modular applications. It includes advanced architectural patterns, state management strategies, performance optimization techniques, and integration patterns that enable scalable micro-frontend development.

## Advanced Architectural Patterns

### Micro-Frontend Communication Patterns

#### Event-Driven Communication

Implement loosely coupled communication between micro-frontends using custom events:

```typescript
// Event system for micro-frontend communication
class MicroFrontendEventBus {
  private eventTarget = new EventTarget();
  
  // Emit events
  emit<T = any>(eventType: string, data: T) {
    const event = new CustomEvent(eventType, { detail: data });
    this.eventTarget.dispatchEvent(event);
  }
  
  // Subscribe to events
  on<T = any>(eventType: string, handler: (data: T) => void) {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<T>;
      handler(customEvent.detail);
    };
    
    this.eventTarget.addEventListener(eventType, listener);
    
    // Return unsubscribe function
    return () => this.eventTarget.removeEventListener(eventType, listener);
  }
  
  // One-time event subscription
  once<T = any>(eventType: string, handler: (data: T) => void) {
    const unsubscribe = this.on(eventType, (data: T) => {
      handler(data);
      unsubscribe();
    });
    return unsubscribe;
  }
}

// Global event bus instance
export const eventBus = new MicroFrontendEventBus();

// Usage in components
const ModelRegistry: React.FC = () => {
  useEffect(() => {
    // Listen for model selection events from other modules
    const unsubscribe = eventBus.on('model:selected', (modelId: string) => {
      console.log('Model selected in another module:', modelId);
      // Update local state or navigate
    });
    
    return unsubscribe;
  }, []);
  
  const handleModelSelect = (model: Model) => {
    // Notify other modules of model selection
    eventBus.emit('model:selected', model.id);
    eventBus.emit('navigation:changed', { 
      module: 'model-registry', 
      path: `/models/${model.id}` 
    });
  };
  
  return <ModelList onSelect={handleModelSelect} />;
};
```

#### Shared State Communication

Use shared state for more structured communication between modules:

```typescript
// Shared state store for inter-module communication
interface SharedState {
  selectedModel?: Model;
  selectedNamespace?: Namespace;
  user?: User;
  notifications: Notification[];
}

class SharedStateStore {
  private state: SharedState = { notifications: [] };
  private subscribers = new Set<(state: SharedState) => void>();
  
  getState(): SharedState {
    return { ...this.state };
  }
  
  setState(updates: Partial<SharedState>) {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
  }
  
  subscribe(callback: (state: SharedState) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.getState()));
  }
}

export const sharedStore = new SharedStateStore();

// React hook for shared state
export const useSharedState = () => {
  const [state, setState] = useState(sharedStore.getState());
  
  useEffect(() => {
    const unsubscribe = sharedStore.subscribe(setState);
    return unsubscribe;
  }, []);
  
  const updateSharedState = useCallback((updates: Partial<SharedState>) => {
    sharedStore.setState(updates);
  }, []);
  
  return [state, updateSharedState] as const;
};

// Usage in components
const ModelDetails: React.FC = () => {
  const [sharedState, updateSharedState] = useSharedState();
  
  const handleModelLoad = (model: Model) => {
    updateSharedState({ selectedModel: model });
  };
  
  return (
    <div>
      <h2>Model: {sharedState.selectedModel?.name}</h2>
      {/* Component content */}
    </div>
  );
};
```

### Module Federation Integration

#### Dynamic Module Loading

Implement dynamic loading of federated modules:

```typescript
// Dynamic module loader
interface ModuleConfig {
  name: string;
  url: string;
  scope: string;
  module: string;
}

class ModuleFederationLoader {
  private loadedModules = new Map<string, any>();
  
  async loadModule(config: ModuleConfig) {
    const { name, url, scope, module } = config;
    
    // Check if already loaded
    if (this.loadedModules.has(name)) {
      return this.loadedModules.get(name);
    }
    
    try {
      // Load the remote module
      await this.loadScript(url);
      
      // Get the container
      const container = window[scope as any];
      await container.init(__webpack_share_scopes__.default);
      
      // Load the specific module
      const factory = await container.get(module);
      const Module = factory();
      
      this.loadedModules.set(name, Module);
      return Module;
    } catch (error) {
      console.error(`Failed to load module ${name}:`, error);
      throw error;
    }
  }
  
  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = url;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      
      document.head.appendChild(script);
    });
  }
}

export const moduleLoader = new ModuleFederationLoader();

// React hook for dynamic module loading
export const useDynamicModule = (config: ModuleConfig) => {
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const loadModule = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const loadedModule = await moduleLoader.loadModule(config);
        setModule(loadedModule);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    loadModule();
  }, [config.name, config.url]);
  
  return { module, loading, error };
};

// Usage in components
const DynamicModuleWrapper: React.FC<{ config: ModuleConfig }> = ({ config }) => {
  const { module: ModuleComponent, loading, error } = useDynamicModule(config);
  
  if (loading) return <div>Loading module...</div>;
  if (error) return <div>Error loading module: {error.message}</div>;
  if (!ModuleComponent) return <div>Module not available</div>;
  
  return <ModuleComponent />;
};
```

#### Module Boundary Error Handling

Implement error boundaries for federated modules:

```typescript
// Error boundary for module federation
interface ModuleErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ModuleErrorBoundary extends React.Component<
  React.PropsWithChildren<{ moduleName: string; fallback?: React.ComponentType }>,
  ModuleErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ModuleErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in module ${this.props.moduleName}:`, error);
    console.error('Error info:', errorInfo);
    
    // Report to error tracking service
    this.reportError(error, errorInfo);
    
    this.setState({ errorInfo });
  }
  
  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Send to error tracking service (e.g., Sentry, Bugsnag)
    // errorTracker.captureException(error, {
    //   tags: { module: this.props.moduleName },
    //   extra: errorInfo
    // });
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultModuleErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error}
          moduleName={this.props.moduleName}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}

// Default error fallback component
const DefaultModuleErrorFallback: React.FC<{
  error?: Error;
  moduleName: string;
  onRetry: () => void;
}> = ({ error, moduleName, onRetry }) => {
  return (
    <div className="module-error-fallback">
      <h3>Module Error</h3>
      <p>The {moduleName} module encountered an error and could not load.</p>
      {error && <p>Error: {error.message}</p>}
      <button onClick={onRetry}>Try Again</button>
    </div>
  );
};

// Usage
const App: React.FC = () => {
  return (
    <div>
      <ModuleErrorBoundary moduleName="model-registry">
        <ModelRegistryModule />
      </ModuleErrorBoundary>
      
      <ModuleErrorBoundary moduleName="experiments">
        <ExperimentsModule />
      </ModuleErrorBoundary>
    </div>
  );
};
```

## Advanced State Management

### Context Composition Patterns

Create composable context providers for complex state management:

```typescript
// Base context creator
function createContext<T>(name: string, defaultValue?: T) {
  const Context = React.createContext<T | undefined>(defaultValue);
  
  function useContext() {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error(`use${name} must be used within ${name}Provider`);
    }
    return context;
  }
  
  return [Context.Provider, useContext, Context] as const;
}

// Feature-specific contexts
interface ModelState {
  models: Model[];
  selectedModel?: Model;
  loading: boolean;
  error?: Error;
}

interface ModelActions {
  loadModels: () => Promise<void>;
  selectModel: (model: Model) => void;
  createModel: (model: Partial<Model>) => Promise<void>;
  updateModel: (id: string, updates: Partial<Model>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
}

const [ModelStateProvider, useModelState] = createContext<ModelState>('ModelState');
const [ModelActionsProvider, useModelActions] = createContext<ModelActions>('ModelActions');

// Combined provider
const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ModelState>({
    models: [],
    loading: false
  });
  
  const actions: ModelActions = {
    loadModels: async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const models = await fetchModels();
        setState(prev => ({ ...prev, models, loading: false }));
      } catch (error) {
        setState(prev => ({ ...prev, error: error as Error, loading: false }));
      }
    },
    
    selectModel: (model: Model) => {
      setState(prev => ({ ...prev, selectedModel: model }));
    },
    
    createModel: async (modelData: Partial<Model>) => {
      const newModel = await createModel(modelData);
      setState(prev => ({ 
        ...prev, 
        models: [...prev.models, newModel] 
      }));
    },
    
    updateModel: async (id: string, updates: Partial<Model>) => {
      const updatedModel = await updateModel(id, updates);
      setState(prev => ({
        ...prev,
        models: prev.models.map(m => m.id === id ? updatedModel : m)
      }));
    },
    
    deleteModel: async (id: string) => {
      await deleteModel(id);
      setState(prev => ({
        ...prev,
        models: prev.models.filter(m => m.id !== id)
      }));
    }
  };
  
  return (
    <ModelStateProvider value={state}>
      <ModelActionsProvider value={actions}>
        {children}
      </ModelActionsProvider>
    </ModelStateProvider>
  );
};

// Usage in components
const ModelList: React.FC = () => {
  const { models, loading, error } = useModelState();
  const { loadModels, selectModel } = useModelActions();
  
  useEffect(() => {
    loadModels();
  }, [loadModels]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {models.map(model => (
        <ModelCard 
          key={model.id} 
          model={model} 
          onSelect={() => selectModel(model)} 
        />
      ))}
    </div>
  );
};
```

### Advanced Hooks Patterns

#### Custom Hooks for Complex Logic

```typescript
// Advanced data fetching hook with caching and retry
interface UseFetchOptions<T> {
  initialData?: T;
  cacheKey?: string;
  cacheTTL?: number; // Time to live in milliseconds
  retryAttempts?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

function useAdvancedFetch<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  options: UseFetchOptions<T> = {}
) {
  const {
    initialData,
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;
  
  const [state, setState] = useState<{
    data?: T;
    loading: boolean;
    error?: Error;
    lastFetch?: number;
  }>({
    data: initialData,
    loading: false
  });
  
  const cache = useRef(new Map<string, { data: T; timestamp: number }>());
  
  const fetchData = useCallback(async (attempt = 1) => {
    // Check cache first
    if (cacheKey) {
      const cached = cache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        setState(prev => ({ ...prev, data: cached.data, loading: false }));
        return;
      }
    }
    
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const data = await fetcher();
      
      // Cache the result
      if (cacheKey) {
        cache.current.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      setState({
        data,
        loading: false,
        lastFetch: Date.now()
      });
      
      onSuccess?.(data);
    } catch (error) {
      if (attempt < retryAttempts) {
        // Retry with exponential backoff
        setTimeout(() => {
          fetchData(attempt + 1);
        }, retryDelay * Math.pow(2, attempt - 1));
      } else {
        setState(prev => ({
          ...prev,
          error: error as Error,
          loading: false
        }));
        
        onError?.(error as Error);
      }
    }
  }, [fetcher, cacheKey, cacheTTL, retryAttempts, retryDelay, onSuccess, onError, ...deps]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  const clearCache = useCallback(() => {
    if (cacheKey) {
      cache.current.delete(cacheKey);
    }
  }, [cacheKey]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    ...state,
    refetch,
    clearCache
  };
}

// Usage
const ModelDetails: React.FC<{ modelId: string }> = ({ modelId }) => {
  const { data: model, loading, error, refetch } = useAdvancedFetch(
    () => fetchModel(modelId),
    [modelId],
    {
      cacheKey: `model-${modelId}`,
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      retryAttempts: 3,
      onSuccess: (model) => {
        console.log('Model loaded:', model.name);
      },
      onError: (error) => {
        console.error('Failed to load model:', error);
      }
    }
  );
  
  if (loading) return <div>Loading model...</div>;
  if (error) return <div>Error: {error.message} <button onClick={refetch}>Retry</button></div>;
  if (!model) return <div>Model not found</div>;
  
  return <ModelDetailsView model={model} />;
};
```

#### State Machine Pattern with Hooks

```typescript
// State machine for complex workflows
type ModelRegistrationState = 
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

type ModelRegistrationEvent =
  | { type: 'START_VALIDATION' }
  | { type: 'VALIDATION_SUCCESS' }
  | { type: 'VALIDATION_ERROR'; error: string }
  | { type: 'START_UPLOAD' }
  | { type: 'UPLOAD_PROGRESS'; progress: number }
  | { type: 'UPLOAD_SUCCESS' }
  | { type: 'UPLOAD_ERROR'; error: string }
  | { type: 'START_PROCESSING' }
  | { type: 'PROCESSING_SUCCESS' }
  | { type: 'PROCESSING_ERROR'; error: string }
  | { type: 'RESET' };

interface ModelRegistrationContext {
  progress: number;
  error?: string;
  modelId?: string;
}

function modelRegistrationReducer(
  state: { current: ModelRegistrationState; context: ModelRegistrationContext },
  event: ModelRegistrationEvent
): { current: ModelRegistrationState; context: ModelRegistrationContext } {
  const { current, context } = state;
  
  switch (current) {
    case 'idle':
      if (event.type === 'START_VALIDATION') {
        return {
          current: 'validating',
          context: { ...context, progress: 0, error: undefined }
        };
      }
      break;
      
    case 'validating':
      if (event.type === 'VALIDATION_SUCCESS') {
        return { current: 'uploading', context: { ...context, progress: 10 } };
      }
      if (event.type === 'VALIDATION_ERROR') {
        return {
          current: 'error',
          context: { ...context, error: event.error }
        };
      }
      break;
      
    case 'uploading':
      if (event.type === 'UPLOAD_PROGRESS') {
        return {
          current: 'uploading',
          context: { ...context, progress: 10 + (event.progress * 0.6) }
        };
      }
      if (event.type === 'UPLOAD_SUCCESS') {
        return { current: 'processing', context: { ...context, progress: 70 } };
      }
      if (event.type === 'UPLOAD_ERROR') {
        return {
          current: 'error',
          context: { ...context, error: event.error }
        };
      }
      break;
      
    case 'processing':
      if (event.type === 'PROCESSING_SUCCESS') {
        return { current: 'completed', context: { ...context, progress: 100 } };
      }
      if (event.type === 'PROCESSING_ERROR') {
        return {
          current: 'error',
          context: { ...context, error: event.error }
        };
      }
      break;
  }
  
  if (event.type === 'RESET') {
    return {
      current: 'idle',
      context: { progress: 0 }
    };
  }
  
  return state;
}

// Hook for state machine
function useModelRegistration() {
  const [state, dispatch] = useReducer(modelRegistrationReducer, {
    current: 'idle',
    context: { progress: 0 }
  });
  
  const startRegistration = useCallback(async (modelData: FormData) => {
    try {
      // Validation phase
      dispatch({ type: 'START_VALIDATION' });
      await validateModel(modelData);
      dispatch({ type: 'VALIDATION_SUCCESS' });
      
      // Upload phase
      dispatch({ type: 'START_UPLOAD' });
      const modelId = await uploadModel(modelData, (progress) => {
        dispatch({ type: 'UPLOAD_PROGRESS', progress });
      });
      dispatch({ type: 'UPLOAD_SUCCESS' });
      
      // Processing phase
      dispatch({ type: 'START_PROCESSING' });
      await processModel(modelId);
      dispatch({ type: 'PROCESSING_SUCCESS' });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (state.current === 'validating') {
        dispatch({ type: 'VALIDATION_ERROR', error: errorMessage });
      } else if (state.current === 'uploading') {
        dispatch({ type: 'UPLOAD_ERROR', error: errorMessage });
      } else if (state.current === 'processing') {
        dispatch({ type: 'PROCESSING_ERROR', error: errorMessage });
      }
    }
  }, [state.current]);
  
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);
  
  return {
    state: state.current,
    context: state.context,
    startRegistration,
    reset,
    canStart: state.current === 'idle',
    isLoading: ['validating', 'uploading', 'processing'].includes(state.current)
  };
}

// Usage in component
const ModelRegistrationForm: React.FC = () => {
  const { state, context, startRegistration, reset, canStart, isLoading } = useModelRegistration();
  const [formData, setFormData] = useState<FormData>(new FormData());
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canStart) {
      await startRegistration(formData);
    }
  };
  
  const getStatusMessage = () => {
    switch (state) {
      case 'validating': return 'Validating model...';
      case 'uploading': return 'Uploading model...';
      case 'processing': return 'Processing model...';
      case 'completed': return 'Model registered successfully!';
      case 'error': return `Error: ${context.error}`;
      default: return 'Ready to register model';
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="registration-status">
        <p>{getStatusMessage()}</p>
        {isLoading && (
          <ProgressBar value={context.progress} max={100} />
        )}
      </div>
      
      {/* Form fields */}
      
      <div className="form-actions">
        <Button 
          type="submit" 
          disabled={!canStart}
          loading={isLoading}
        >
          Register Model
        </Button>
        {state === 'error' && (
          <Button variant="secondary" onClick={reset}>
            Try Again
          </Button>
        )}
      </div>
    </form>
  );
};
```

## Performance Optimization Patterns

### Virtual Scrolling for Large Lists

```typescript
// Virtual scrolling hook for performance
interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside visible area
}

function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );
  
  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    setScrollTop
  };
}

// Virtual list component
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

function VirtualList<T>({ items, itemHeight, height, renderItem }: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    setScrollTop
  } = useVirtualScroll(items, { itemHeight, containerHeight: height });
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };
  
  return (
    <div
      ref={containerRef}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Usage
const ModelList: React.FC = () => {
  const { models } = useModels();
  
  return (
    <VirtualList
      items={models}
      itemHeight={80}
      height={600}
      renderItem={(model, index) => (
        <ModelCard key={model.id} model={model} />
      )}
    />
  );
};
```

### Optimistic Updates Pattern

```typescript
// Optimistic updates for better UX
function useOptimisticUpdates<T extends { id: string }>(
  items: T[],
  updateFn: (id: string, updates: Partial<T>) => Promise<T>
) {
  const [optimisticItems, setOptimisticItems] = useState(items);
  const [failedUpdates, setFailedUpdates] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    setOptimisticItems(items);
  }, [items]);
  
  const updateOptimistically = async (id: string, updates: Partial<T>) => {
    // Apply optimistic update immediately
    setOptimisticItems(current =>
      current.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
    
    try {
      // Perform actual update
      const updatedItem = await updateFn(id, updates);
      
      // Replace optimistic update with real data
      setOptimisticItems(current =>
        current.map(item =>
          item.id === id ? updatedItem : item
        )
      );
      
      // Remove from failed updates if it was there
      setFailedUpdates(current => {
        const updated = new Set(current);
        updated.delete(id);
        return updated;
      });
      
    } catch (error) {
      // Revert optimistic update on failure
      setOptimisticItems(current =>
        current.map(item =>
          item.id === id ? items.find(original => original.id === id) || item : item
        )
      );
      
      // Mark as failed
      setFailedUpdates(current => new Set(current).add(id));
      
      throw error;
    }
  };
  
  return {
    items: optimisticItems,
    updateOptimistically,
    failedUpdates
  };
}

// Usage
const ModelCard: React.FC<{ model: Model }> = ({ model }) => {
  const { updateOptimistically, failedUpdates } = useOptimisticUpdates(
    [model],
    updateModel
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(model.name);
  
  const handleSave = async () => {
    try {
      await updateOptimistically(model.id, { name });
      setIsEditing(false);
    } catch (error) {
      // Show error message
      console.error('Failed to update model:', error);
      // Name will be reverted automatically
    }
  };
  
  const isFailed = failedUpdates.has(model.id);
  
  return (
    <Card className={isFailed ? 'update-failed' : ''}>
      {isEditing ? (
        <div>
          <TextInput value={name} onChange={setName} />
          <Button onClick={handleSave}>Save</Button>
          <Button variant="secondary" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div>
          <h3>{model.name}</h3>
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
          {isFailed && <span className="error">Update failed</span>}
        </div>
      )}
    </Card>
  );
};
```

## Testing Patterns

### Component Testing with Context

```typescript
// Test utilities for components with context
import { render, screen } from '@testing-library/react';
import { ModularArchContextProvider, ThemeProvider } from 'mod-arch-shared';

function renderWithContext(
  ui: React.ReactElement,
  {
    config = {
      deploymentMode: DeploymentMode.Standalone,
      URL_PREFIX: '/api',
      BFF_API_VERSION: 'v1'
    },
    theme = Theme.Patternfly,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ModularArchContextProvider config={config}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </ModularArchContextProvider>
    );
  }
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock providers for testing
function createMockContext(overrides: Partial<ModularArchContextType> = {}) {
  return {
    config: {
      deploymentMode: DeploymentMode.Standalone,
      URL_PREFIX: '/api',
      BFF_API_VERSION: 'v1'
    },
    namespacesLoaded: true,
    namespaces: [
      { name: 'default', status: 'Active' },
      { name: 'test', status: 'Active' }
    ],
    preferredNamespace: { name: 'default', status: 'Active' },
    updatePreferredNamespace: jest.fn(),
    scriptLoaded: true,
    ...overrides
  };
}

// Test example
describe('ModelCard', () => {
  test('displays model information correctly', () => {
    const model = {
      id: '1',
      name: 'Test Model',
      version: '1.0.0',
      created: '2023-01-01T00:00:00Z'
    };
    
    renderWithContext(<ModelCard model={model} />);
    
    expect(screen.getByText('Test Model')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });
  
  test('handles namespace switching', async () => {
    const mockUpdateNamespace = jest.fn();
    const contextValue = createMockContext({
      updatePreferredNamespace: mockUpdateNamespace
    });
    
    renderWithContext(<NamespaceSelector />, {
      contextValue
    });
    
    await userEvent.click(screen.getByRole('button', { name: /namespace/i }));
    await userEvent.click(screen.getByText('test'));
    
    expect(mockUpdateNamespace).toHaveBeenCalledWith({
      name: 'test',
      status: 'Active'
    });
  });
});
```

### Integration Testing Patterns

```typescript
// Integration test setup
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API responses
const server = setupServer(
  rest.get('/api/v1/namespaces', (req, res, ctx) => {
    return res(
      ctx.json([
        { name: 'default', status: 'Active' },
        { name: 'test', status: 'Active' }
      ])
    );
  }),
  
  rest.get('/api/v1/models', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Model 1', version: '1.0.0' },
        { id: '2', name: 'Model 2', version: '2.0.0' }
      ])
    );
  }),
  
  rest.post('/api/v1/models', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ id: '3', name: 'New Model', version: '1.0.0' })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Integration test
describe('Model Management Flow', () => {
  test('complete model creation flow', async () => {
    renderWithContext(<ModelManagementPage />);
    
    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByText('Model 1')).toBeInTheDocument();
    });
    
    // Create new model
    await userEvent.click(screen.getByText('Create Model'));
    
    // Fill form
    await userEvent.type(screen.getByLabelText('Model Name'), 'New Model');
    await userEvent.type(screen.getByLabelText('Version'), '1.0.0');
    
    // Submit form
    await userEvent.click(screen.getByText('Create'));
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Model created successfully')).toBeInTheDocument();
    });
  });
});
```

## Multi-Mode Architecture Patterns

### Deployment Mode Abstraction

Based on the Model Registry implementation, implement flexible deployment mode handling:

#### Mode-Aware Component Factory

```typescript
// Advanced pattern for mode-specific component rendering
interface ComponentFactoryConfig {
  mode: 'standalone' | 'kubeflow' | 'federated';
  theme: 'patternfly-theme' | 'mui-theme';
  features: FeatureFlags;
}

class ComponentFactory {
  private config: ComponentFactoryConfig;
  private componentRegistry = new Map<string, ComponentDefinition>();
  
  constructor(config: ComponentFactoryConfig) {
    this.config = config;
    this.registerDefaultComponents();
  }
  
  // Register mode-specific component variants
  registerComponent(name: string, definition: ComponentDefinition) {
    this.componentRegistry.set(name, definition);
  }
  
  // Get component based on current mode and features
  getComponent<T = React.ComponentType>(name: string): T | null {
    const definition = this.componentRegistry.get(name);
    if (!definition) return null;
    
    // Select component variant based on mode
    const variant = this.selectVariant(definition);
    return variant as T;
  }
  
  private selectVariant(definition: ComponentDefinition): React.ComponentType {
    // Mode-specific selection logic
    if (this.config.mode === 'kubeflow' && definition.kubeflowVariant) {
      return definition.kubeflowVariant;
    }
    
    if (this.config.mode === 'federated' && definition.federatedVariant) {
      return definition.federatedVariant;
    }
    
    // Theme-specific variants
    if (this.config.theme === 'mui-theme' && definition.muiVariant) {
      return definition.muiVariant;
    }
    
    return definition.defaultVariant;
  }
  
  private registerDefaultComponents() {
    // Navigation component variants
    this.registerComponent('Navigation', {
      defaultVariant: StandaloneNavigation,
      kubeflowVariant: KubeflowNavigation,
      federatedVariant: FederatedNavigation,
    });
    
    // Settings component variants
    this.registerComponent('Settings', {
      defaultVariant: FullSettings,
      kubeflowVariant: null, // No settings in Kubeflow mode
      federatedVariant: FederatedSettings,
    });
    
    // User management variants
    this.registerComponent('UserMenu', {
      defaultVariant: StandardUserMenu,
      kubeflowVariant: KubeflowUserMenu,
      federatedVariant: FederatedUserMenu,
    });
  }
}

// Component definition interface
interface ComponentDefinition {
  defaultVariant: React.ComponentType;
  kubeflowVariant?: React.ComponentType | null;
  federatedVariant?: React.ComponentType;
  muiVariant?: React.ComponentType;
  patternflyVariant?: React.ComponentType;
}

// Usage in application
const App: React.FC = () => {
  const config = useDeploymentConfig();
  const componentFactory = new ComponentFactory(config);
  
  const Navigation = componentFactory.getComponent<React.ComponentType>('Navigation');
  const Settings = componentFactory.getComponent<React.ComponentType>('Settings');
  const UserMenu = componentFactory.getComponent<React.ComponentType>('UserMenu');
  
  return (
    <AppLayout>
      {Navigation && <Navigation />}
      <MainContent />
      {Settings && <Settings />}
      {UserMenu && <UserMenu />}
    </AppLayout>
  );
};
```

### Advanced Authentication Patterns

#### Authentication State Machine

Implement sophisticated authentication flow management:

```typescript
// Authentication state machine for complex auth flows
import { createMachine, interpret } from 'xstate';

interface AuthContext {
  user: User | null;
  token: string | null;
  error: string | null;
  authMethod: 'internal' | 'user_token';
  retryCount: number;
}

type AuthEvent = 
  | { type: 'LOGIN'; credentials: LoginCredentials }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESH' }
  | { type: 'AUTH_SUCCESS'; user: User; token?: string }
  | { type: 'AUTH_FAILURE'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

const authMachine = createMachine<AuthContext, AuthEvent>({
  id: 'authentication',
  initial: 'initializing',
  context: {
    user: null,
    token: null,
    error: null,
    authMethod: 'user_token',
    retryCount: 0,
  },
  states: {
    initializing: {
      invoke: {
        src: 'checkExistingAuth',
        onDone: {
          target: 'authenticated',
          actions: 'setAuthData',
        },
        onError: {
          target: 'unauthenticated',
        },
      },
    },
    unauthenticated: {
      on: {
        LOGIN: {
          target: 'authenticating',
          actions: 'clearError',
        },
      },
    },
    authenticating: {
      invoke: {
        src: 'performAuthentication',
        onDone: {
          target: 'authenticated',
          actions: 'setAuthData',
        },
        onError: [
          {
            target: 'authError',
            cond: 'shouldRetry',
            actions: 'incrementRetry',
          },
          {
            target: 'authFailure',
            actions: 'setAuthError',
          },
        ],
      },
    },
    authenticated: {
      invoke: {
        src: 'tokenRefreshService',
      },
      on: {
        LOGOUT: {
          target: 'unauthenticated',
          actions: 'clearAuthData',
        },
        TOKEN_REFRESH: {
          target: 'refreshing',
        },
        AUTH_FAILURE: {
          target: 'unauthenticated',
          actions: 'clearAuthData',
        },
      },
    },
    refreshing: {
      invoke: {
        src: 'refreshToken',
        onDone: {
          target: 'authenticated',
          actions: 'updateToken',
        },
        onError: {
          target: 'unauthenticated',
          actions: 'clearAuthData',
        },
      },
    },
    authError: {
      after: {
        2000: 'authenticating', // Retry after 2 seconds
      },
      on: {
        RETRY: 'authenticating',
        RESET: 'unauthenticated',
      },
    },
    authFailure: {
      on: {
        LOGIN: {
          target: 'authenticating',
          actions: 'clearError',
        },
        RESET: 'unauthenticated',
      },
    },
  },
}, {
  actions: {
    setAuthData: (context, event) => {
      context.user = event.data.user;
      context.token = event.data.token;
      context.error = null;
      context.retryCount = 0;
    },
    clearAuthData: (context) => {
      context.user = null;
      context.token = null;
      context.error = null;
    },
    setAuthError: (context, event) => {
      context.error = event.data.message;
    },
    clearError: (context) => {
      context.error = null;
    },
    incrementRetry: (context) => {
      context.retryCount += 1;
    },
    updateToken: (context, event) => {
      context.token = event.data.token;
    },
  },
  guards: {
    shouldRetry: (context) => context.retryCount < 3,
  },
  services: {
    checkExistingAuth: async (context) => {
      if (context.authMethod === 'internal') {
        return await checkKubeflowAuth();
      } else {
        return await checkStoredToken();
      }
    },
    performAuthentication: async (context, event) => {
      if (context.authMethod === 'internal') {
        return await authenticateWithKubeflow();
      } else {
        return await authenticateWithToken(event.credentials);
      }
    },
    refreshToken: async (context) => {
      return await refreshAuthToken(context.token);
    },
    tokenRefreshService: (context) => (callback) => {
      const interval = setInterval(() => {
        callback({ type: 'TOKEN_REFRESH' });
      }, 15 * 60 * 1000); // Refresh every 15 minutes
      
      return () => clearInterval(interval);
    },
  },
});

// React hook for authentication state machine
export const useAuthMachine = (authMethod: 'internal' | 'user_token') => {
  const [state, send] = useInterpret(authMachine, {
    context: { authMethod },
  });
  
  const login = useCallback((credentials: LoginCredentials) => {
    send({ type: 'LOGIN', credentials });
  }, [send]);
  
  const logout = useCallback(() => {
    send({ type: 'LOGOUT' });
  }, [send]);
  
  const retry = useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);
  
  return {
    state: state.value,
    context: state.context,
    login,
    logout,
    retry,
    isAuthenticated: state.matches('authenticated'),
    isAuthenticating: state.matches('authenticating'),
    isError: state.matches('authError') || state.matches('authFailure'),
  };
};
```

### Backend For Frontend (BFF) Advanced Patterns

#### Comprehensive Middleware Chain

```go
// Advanced middleware chain with comprehensive capabilities
type MiddlewareChain struct {
    handlers []MiddlewareHandler
    config   *MiddlewareConfig
}

type MiddlewareConfig struct {
    // Authentication configuration
    AuthMethod        string
    MockK8sClient     bool
    MockAPIClient     bool
    
    // Observability configuration
    EnableMetrics     bool
    EnableTracing     bool
    EnableLogging     bool
    
    // Performance configuration
    EnableCompression bool
    EnableCaching     bool
    RateLimit         *RateLimitConfig
    
    // Security configuration
    AllowedOrigins    []string
    CSPPolicy         string
    HSTSMaxAge        int
}

type RateLimitConfig struct {
    Enabled     bool
    Rate        int    // requests per second
    Burst       int    // burst capacity
    CleanupRate int    // cleanup interval in seconds
}

func NewMiddlewareChain(config *MiddlewareConfig) *MiddlewareChain {
    chain := &MiddlewareChain{
        config:   config,
        handlers: make([]MiddlewareHandler, 0),
    }
    
    // Build middleware chain in order
    chain.addRecoveryMiddleware()
    chain.addSecurityMiddleware()
    chain.addObservabilityMiddleware()
    chain.addPerformanceMiddleware()
    chain.addAuthenticationMiddleware()
    chain.addAuthorizationMiddleware()
    
    return chain
}

func (mc *MiddlewareChain) addRecoveryMiddleware() {
    mc.handlers = append(mc.handlers, func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            defer func() {
                if err := recover(); err != nil {
                    log.Printf("Panic recovered: %v", err)
                    http.Error(w, "Internal Server Error", http.StatusInternalServerError)
                }
            }()
            
            next.ServeHTTP(w, r)
        })
    })
}

func (mc *MiddlewareChain) addSecurityMiddleware() {
    mc.handlers = append(mc.handlers, func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // CORS headers
            origin := r.Header.Get("Origin")
            if isAllowedOrigin(origin, mc.config.AllowedOrigins) {
                w.Header().Set("Access-Control-Allow-Origin", origin)
            }
            
            w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, kubeflow-userid, kubeflow-groups")
            w.Header().Set("Access-Control-Allow-Credentials", "true")
            
            // Security headers
            w.Header().Set("X-Content-Type-Options", "nosniff")
            w.Header().Set("X-Frame-Options", "DENY")
            w.Header().set("X-XSS-Protection", "1; mode=block")
            
            if mc.config.CSPPolicy != "" {
                w.Header().Set("Content-Security-Policy", mc.config.CSPPolicy)
            }
            
            if mc.config.HSTSMaxAge > 0 {
                w.Header().Set("Strict-Transport-Security", 
                    fmt.Sprintf("max-age=%d; includeSubDomains", mc.config.HSTSMaxAge))
            }
            
            // Handle preflight requests
            if r.Method == "OPTIONS" {
                w.WriteHeader(http.StatusOK)
                return
            }
            
            next.ServeHTTP(w, r)
        })
    })
}

func (mc *MiddlewareChain) addObservabilityMiddleware() {
    if mc.config.EnableMetrics {
        mc.handlers = append(mc.handlers, mc.metricsMiddleware())
    }
    
    if mc.config.EnableLogging {
        mc.handlers = append(mc.handlers, mc.loggingMiddleware())
    }
    
    if mc.config.EnableTracing {
        mc.handlers = append(mc.handlers, mc.tracingMiddleware())
    }
}

func (mc *MiddlewareChain) addPerformanceMiddleware() {
    if mc.config.EnableCompression {
        mc.handlers = append(mc.handlers, mc.compressionMiddleware())
    }
    
    if mc.config.EnableCaching {
        mc.handlers = append(mc.handlers, mc.cachingMiddleware())
    }
    
    if mc.config.RateLimit != nil && mc.config.RateLimit.Enabled {
        mc.handlers = append(mc.handlers, mc.rateLimitMiddleware())
    }
}

func (mc *MiddlewareChain) metricsMiddleware() MiddlewareHandler {
    return func(next http.Handler) http.Handler {
        return promhttp.InstrumentHandlerDuration(
            httpDuration.MustCurryWith(prometheus.Labels{}),
            promhttp.InstrumentHandlerCounter(
                httpRequests.MustCurryWith(prometheus.Labels{}),
                next,
            ),
        )
    }
}

func (mc *MiddlewareChain) loggingMiddleware() MiddlewareHandler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            
            // Create response recorder to capture status code
            recorder := &ResponseRecorder{ResponseWriter: w, StatusCode: 200}
            
            next.ServeHTTP(recorder, r)
            
            // Log request details
            log.Printf("method=%s path=%s status=%d duration=%v user=%s",
                r.Method,
                r.URL.Path,
                recorder.StatusCode,
                time.Since(start),
                getUserIDFromContext(r.Context()),
            )
        })
    }
}

func (mc *MiddlewareChain) rateLimitMiddleware() MiddlewareHandler {
    limiter := rate.NewLimiter(
        rate.Limit(mc.config.RateLimit.Rate),
        mc.config.RateLimit.Burst,
    )
    
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if !limiter.Allow() {
                http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
                return
            }
            
            next.ServeHTTP(w, r)
        })
    }
}

// Apply middleware chain to router
func (mc *MiddlewareChain) Apply(router *mux.Router) {
    for _, handler := range mc.handlers {
        router.Use(handler)
    }
}
```
