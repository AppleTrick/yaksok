import asyncio

import pytest

from app.admission import AdmissionGate, Overloaded
from app.scan.onnx_pipeline import InvalidImage, confirmed_name, decode, usable
from app.scan.product_matcher import Line, ProductMatcher


def test_typo_still_finds_product():
    m = ProductMatcher(["센트룸 우먼", "센트룸 맨", "고려은단 비타민C 1000", "종합비타민"])
    assert m.match([Line("고려온단", .9, 80), Line("비타민C 1000", .9, 70)])[0]["name"] == "고려은단 비타민C 1000"


def test_generic_label_text_matches_nothing():
    assert ProductMatcher(["건강기능식품 플러스"]).match([Line("건강기능식품", .99, 100)]) == []


@pytest.mark.parametrize("data", [b"", b"not an image", b"<svg xmlns='http://www.w3.org/2000/svg'/>", b"GIF89a" + b"\0" * 50])
def test_rejects_non_images(data):
    with pytest.raises(InvalidImage):
        decode(data)


def test_gate_rejects_when_full_and_recovers():
    async def run():
        gate = AdmissionGate(workers=1, queue=1, wait_seconds=0.05)
        release = asyncio.Event()

        async def hold():
            async with gate.enter():
                await release.wait()

        first = asyncio.create_task(hold())
        await asyncio.sleep(0)
        second = asyncio.create_task(hold())          # 줄에 선다
        await asyncio.sleep(0)
        with pytest.raises(Overloaded):               # 줄도 찼다
            async with gate.enter():
                pass
        with pytest.raises(Overloaded):               # 줄에서 기다리다 시간 초과
            await second
        release.set()
        await first
        async with gate.enter():                      # 자리가 다시 난다
            pass
        assert gate.inside == 0 and gate.rejected == 2
    asyncio.run(run())


def test_close_second_candidate_is_never_confirmed():
    assert confirmed_name([{"name": "공스킨 비타민D", "score": .936}, {"name": "공스킨 비타민C", "score": .934}]) == ""
    assert confirmed_name([{"name": "일양비타민C&D1000", "score": .758}, {"name": "다른 제품", "score": .462}]) == "일양비타민C&D1000"
    assert confirmed_name([{"name": "낮은 점수", "score": .4}]) == ""


def test_unreadable_label_gives_no_candidates():
    assert usable([{"name": "12종혼합유산균", "score": .295}]) == []
    assert len(usable([{"name": "메가도스C", "score": .45}, {"name": "다른 제품", "score": .2}])) == 1
