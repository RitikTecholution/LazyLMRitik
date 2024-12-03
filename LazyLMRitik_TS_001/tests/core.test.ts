import pytest
from unittest.mock import Mock, patch
from lazy_lm.core import LazyState, LazyEvaluationClient, lazy

@pytest.fixture
def mock_llm():
    return Mock()

@pytest.fixture
def lazy_state():
    return LazyState("Test problem")

@pytest.fixture
def lazy_client(mock_llm, lazy_state):
    return LazyEvaluationClient(mock_llm, 100, lazy_state)

def test_lazy_state_initialization():
    state = LazyState("Test problem")
    assert state.getContext() == "Test problem"

def test_lazy_state_add_step():
    state = LazyState("Test problem")
    state.addStep("Step 1")
    assert state.getContext() == "Test problem\nStep 1"

def test_lazy_state_refresh():
    state = LazyState("Test problem")
    state.addStep("Step 1")
    state.refresh()
    assert state.getContext() == "Test problem"

@patch('lazy_lm.core.AnthropicVertex')
def test_lazy_evaluation_client_initialization(mock_anthropic):
    client = lazy("Test problem")
    assert isinstance(client, LazyEvaluationClient)
    assert client.state.getContext() == "Test problem"

def test_lazy_evaluation_client_get_current_step(lazy_client):
    lazy_client.state.addStep("Step 1")
    assert lazy_client.getCurrentStep() == "Step 1"

@pytest.mark.asyncio
async def test_lazy_evaluation_client_get_next_step(lazy_client):
    lazy_client.llm.client.complete.return_value = Mock(completion="Next step")
    next_step = await lazy_client.getNextStep()
    assert next_step == "Next step"
    lazy_client.llm.client.complete.assert_called_once()

@pytest.mark.asyncio
async def test_lazy_evaluation_client_ask_question(lazy_client):
    lazy_client.llm.client.complete.return_value = Mock(completion="Answer")
    answer = await lazy_client.askQuestion("Test question")
    assert answer == "Answer"
    lazy_client.llm.client.complete.assert_called_once()

if __name__ == "__main__":
    pytest.main()