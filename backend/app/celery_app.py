"""Celery configuration."""

import os

try:
    from celery import Celery
    
    # Create Celery app
    celery_app = Celery(
        "modele_backend",
        broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    )
    
    # Configure Celery
    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_time_limit=30 * 60,  # 30 minutes
    )
    
    @celery_app.task(bind=True)
    def debug_task(self):
        """Debug task."""
        print(f"Request: {self.request!r}")
    
    CELERY_AVAILABLE = True
except ImportError:
    # Celery not installed - create a mock celery_app for compatibility
    class MockTask:
        """Mock task object when celery is not available."""
        def __init__(self, func, bind=False):
            self._func = func
            self._bind = bind
            import functools
            functools.update_wrapper(self, func)
        
        def delay(self, *args, **kwargs):
            # Execute synchronously when celery is not available
            if self._bind:
                # If bind=True, we need to create a mock self object
                class MockSelf:
                    pass
                return self._func(MockSelf(), *args, **kwargs)
            else:
                return self._func(*args, **kwargs)
        
        def __call__(self, *args, **kwargs):
            # Call the original function
            if self._bind:
                # First arg is self
                if args:
                    return self._func(*args, **kwargs)
                else:
                    class MockSelf:
                        pass
                    return self._func(MockSelf(), **kwargs)
            else:
                return self._func(*args, **kwargs)
    
    class MockCeleryApp:
        """Mock Celery app when celery is not available."""
        def task(self, bind=False, max_retries=None, *args, **kwargs):
            def decorator(func):
                # Create a mock task that can be called directly or via .delay()
                return MockTask(func, bind=bind)
            return decorator
    
    celery_app = MockCeleryApp()
    CELERY_AVAILABLE = False
