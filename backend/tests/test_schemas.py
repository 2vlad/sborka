"""Tests for schema models: instantiation, serialization, and validation."""

import uuid

from app.schemas.blocks import (
    Block,
    CalloutPayload,
    DialogMessage,
    DialogPayload,
    HeadingPayload,
    ImagePayload,
    MarkdownPayload,
    PracticeTaskPayload,
    QuizMultiPayload,
    QuizOption,
    QuizSinglePayload,
)
from app.schemas.events import (
    AssetReadyEvent,
    AssetReservedEvent,
    BlockDeltaEvent,
    BlockReadyEvent,
    BlockStartedEvent,
    ClassificationReadyEvent,
    DoneEvent,
    ErrorEvent,
    LessonScaffoldReadyEvent,
    OutlineReadyEvent,
    PlanNodeStatusEvent,
    SessionCreatedEvent,
)
from app.schemas.session import PlanNode, SessionCreate, SessionResponse

# ---------------------------------------------------------------------------
# Block payload models
# ---------------------------------------------------------------------------


class TestPayloadModels:
    def test_heading_payload(self):
        p = HeadingPayload(level=2, text="Introduction")
        assert p.level == 2
        assert p.text == "Introduction"
        data = p.model_dump()
        assert data["level"] == 2

    def test_markdown_payload(self):
        p = MarkdownPayload(markdown="# Hello\n\nWorld")
        assert "Hello" in p.markdown

    def test_quiz_option(self):
        o = QuizOption(id="a", text="Option A")
        assert o.id == "a"

    def test_quiz_single_payload(self):
        p = QuizSinglePayload(
            question="What is 2+2?",
            options=[
                QuizOption(id="a", text="3"),
                QuizOption(id="b", text="4"),
                QuizOption(id="c", text="5"),
            ],
            correct_option_id="b",
            explanation="2+2=4",
        )
        assert p.correct_option_id == "b"
        assert len(p.options) == 3

    def test_quiz_multi_payload(self):
        p = QuizMultiPayload(
            question="Select all even numbers:",
            options=[
                QuizOption(id="a", text="1"),
                QuizOption(id="b", text="2"),
                QuizOption(id="c", text="3"),
                QuizOption(id="d", text="4"),
            ],
            correct_option_ids=["b", "d"],
            explanation="2 and 4 are even",
        )
        assert len(p.correct_option_ids) == 2

    def test_practice_task_payload(self):
        p = PracticeTaskPayload(
            description="Build a hello world app",
            criteria=["App runs", "Output is correct"],
        )
        assert len(p.criteria) == 2

    def test_callout_payload(self):
        p = CalloutPayload(style="info", markdown="Note: this is important")
        assert p.style == "info"

    def test_dialog_payload(self):
        p = DialogPayload(
            messages=[
                DialogMessage(role="student", text="What is this?"),
                DialogMessage(role="teacher", text="It's a concept."),
            ]
        )
        assert len(p.messages) == 2

    def test_image_payload(self):
        p = ImagePayload(
            alt="Diagram",
            caption="Architecture overview",
            image_prompt="clean diagram showing architecture",
        )
        assert p.aspect_ratio == "16:9"
        assert p.url is None

    def test_image_payload_with_url(self):
        p = ImagePayload(
            alt="Photo",
            caption="Example",
            image_prompt="example photo",
            url="https://example.com/img.png",
        )
        assert p.url == "https://example.com/img.png"


# ---------------------------------------------------------------------------
# Block model
# ---------------------------------------------------------------------------


class TestBlock:
    def test_block_default_status(self):
        b = Block(id=str(uuid.uuid4()), type="markdown")
        assert b.status == "planned"
        assert b.payload == {}

    def test_block_with_heading_payload(self):
        b = Block(
            id=str(uuid.uuid4()),
            type="heading",
            status="ready",
            payload={"level": 2, "text": "Title"},
        )
        assert b.type == "heading"
        assert b.payload["level"] == 2

    def test_block_with_quiz_payload(self):
        b = Block(
            id=str(uuid.uuid4()),
            type="quiz_single",
            payload={
                "question": "Q?",
                "options": [{"id": "a", "text": "A"}],
                "correct_option_id": "a",
                "explanation": "Because.",
            },
        )
        assert b.type == "quiz_single"
        assert b.payload["correct_option_id"] == "a"

    def test_block_serialization_roundtrip(self):
        b = Block(
            id="test-id",
            type="image",
            status="planned",
            payload={"alt": "img", "caption": "cap", "image_prompt": "prompt"},
        )
        data = b.model_dump()
        b2 = Block.model_validate(data)
        assert b2.id == b.id
        assert b2.type == b.type


# ---------------------------------------------------------------------------
# Event models
# ---------------------------------------------------------------------------


class TestEvents:
    def _sid(self) -> str:
        return str(uuid.uuid4())

    def test_session_created(self):
        e = SessionCreatedEvent(session_id=self._sid())
        assert e.type == "session_created"
        data = e.model_dump()
        assert "session_id" in data

    def test_classification_ready(self):
        e = ClassificationReadyEvent(
            session_id=self._sid(),
            scale="module",
            title="React Architecture",
            time_estimate="2-3 hours",
        )
        assert e.type == "classification_ready"
        assert e.scale == "module"

    def test_outline_ready(self):
        node = PlanNode(
            id=str(uuid.uuid4()),
            type="lesson",
            title="Lesson 1",
        )
        e = OutlineReadyEvent(session_id=self._sid(), outline=[node])
        assert len(e.outline) == 1

    def test_lesson_scaffold_ready(self):
        blocks = [
            Block(id=str(uuid.uuid4()), type="heading", payload={"level": 2, "text": "H"}),
        ]
        e = LessonScaffoldReadyEvent(
            session_id=self._sid(),
            lesson_id=str(uuid.uuid4()),
            blocks=blocks,
        )
        assert len(e.blocks) == 1

    def test_block_started(self):
        e = BlockStartedEvent(
            session_id=self._sid(),
            lesson_id=str(uuid.uuid4()),
            block_id=str(uuid.uuid4()),
        )
        assert e.type == "block_started"

    def test_block_delta(self):
        e = BlockDeltaEvent(
            session_id=self._sid(),
            lesson_id=str(uuid.uuid4()),
            block_id=str(uuid.uuid4()),
            delta="Hello ",
        )
        assert e.delta == "Hello "

    def test_block_ready(self):
        e = BlockReadyEvent(
            session_id=self._sid(),
            lesson_id=str(uuid.uuid4()),
            block_id=str(uuid.uuid4()),
            payload={"markdown": "content"},
        )
        assert e.payload["markdown"] == "content"

    def test_asset_reserved(self):
        e = AssetReservedEvent(
            session_id=self._sid(),
            lesson_id=str(uuid.uuid4()),
            block_id=str(uuid.uuid4()),
            asset_id=str(uuid.uuid4()),
            aspect_ratio="16:9",
            caption="Test image",
        )
        assert e.type == "asset_reserved"

    def test_asset_ready(self):
        e = AssetReadyEvent(
            session_id=self._sid(),
            asset_id=str(uuid.uuid4()),
            url="https://placehold.co/800x450",
        )
        assert e.url.startswith("https://")

    def test_error_event(self):
        e = ErrorEvent(
            session_id=self._sid(),
            scope="block",
            message="Generation failed",
            block_id=str(uuid.uuid4()),
        )
        assert e.type == "error"
        assert e.scope == "block"

    def test_error_event_no_block_id(self):
        e = ErrorEvent(
            session_id=self._sid(),
            scope="session",
            message="Something went wrong",
        )
        assert e.block_id is None

    def test_done_event(self):
        e = DoneEvent(session_id=self._sid())
        assert e.type == "done"

    def test_plan_node_status(self):
        e = PlanNodeStatusEvent(
            session_id=self._sid(),
            node_id=str(uuid.uuid4()),
            status="generating",
        )
        assert e.type == "plan_node_status"

    def test_event_json_serialization(self):
        e = ClassificationReadyEvent(
            session_id="abc-123",
            scale="lesson",
            title="Test",
            time_estimate="10 min",
        )
        json_str = e.model_dump_json()
        assert "abc-123" in json_str
        assert "classification_ready" in json_str


# ---------------------------------------------------------------------------
# Session schemas
# ---------------------------------------------------------------------------


class TestSessionSchemas:
    def test_plan_node_basic(self):
        n = PlanNode(
            id=str(uuid.uuid4()),
            type="lesson",
            title="Lesson 1",
        )
        assert n.status == "planned"
        assert n.children == []
        assert n.lesson_id is None

    def test_plan_node_nested(self):
        child = PlanNode(
            id=str(uuid.uuid4()),
            type="lesson",
            title="Lesson 1",
            lesson_id="lesson-1",
        )
        parent = PlanNode(
            id=str(uuid.uuid4()),
            type="topic",
            title="Topic 1",
            children=[child],
        )
        assert len(parent.children) == 1
        assert parent.children[0].lesson_id == "lesson-1"

    def test_session_create(self):
        sc = SessionCreate(user_request="Learn React")
        assert sc.user_request == "Learn React"

    def test_session_response(self):
        sr = SessionResponse(session_id="abc-123")
        data = sr.model_dump()
        assert data["session_id"] == "abc-123"
