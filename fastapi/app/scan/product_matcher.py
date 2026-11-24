"""OCR 글자 → 제품 이름 후보. 외부 API 없이 식약처 제품명 목록에서 찾는다.

제품 이름을 두 글자 조각으로 색인하고 다음 두 값을 섞어 점수를 매긴다.
- cover  : 제품 이름 중 사진에서 실제로 읽은 비율
- explain: 사진의 (큰) 글씨 중 이 이름으로 설명되는 비율
OCR이 몇 글자 틀려도 나머지 조각이 맞으면 찾는다.
"""
import gzip
import math
import os
import re
from collections import defaultdict
from typing import NamedTuple

DEFAULT_NAMES = os.path.join(os.path.dirname(__file__), "..", "..", "data", "product_names.txt.gz")

# 라벨마다 붙어 있어 제품을 가리지 못하는 문구
GENERIC = {"건강기능식품", "식품의약품안전처", "기능식품", "건강"}


class Line(NamedTuple):
    text: str
    score: float
    height: float


def normalize(text: str) -> str:
    return re.sub(r"[^0-9a-z가-힣]", "", text.lower())


def grams(text: str) -> set:
    return {text[i:i + 2] for i in range(len(text) - 1)} if len(text) > 1 else ({text} if text else set())


class ProductMatcher:
    # beta < 1: 사진의 다른 문구까지 다 설명하는지보다 제품 이름이 얼마나 읽혔는지를 더 본다
    BETA2 = 0.25

    def __init__(self, names):
        self.names = list(names)
        self._grams = [grams(normalize(n)) for n in self.names]
        index = defaultdict(list)
        for i, gs in enumerate(self._grams):
            for g in gs:
                index[g].append(i)
        self._index = dict(index)
        n = max(len(self.names), 1)
        self._idf = {g: math.log(1 + n / len(ids)) for g, ids in self._index.items()}
        self._total = [sum(self._idf[g] for g in gs) for gs in self._grams]

    @classmethod
    def load(cls, path: str = DEFAULT_NAMES) -> "ProductMatcher":
        with gzip.open(path, "rt", encoding="utf-8") as f:
            return cls([line.strip() for line in f if line.strip()])

    def match(self, lines, top: int = 3):
        if not lines:
            return []
        tallest = max(line.height for line in lines) or 1
        weight = {}
        for line in lines:
            key = normalize(line.text)
            if key in GENERIC:
                continue
            w = line.score * (line.height / tallest)
            for g in grams(key):
                if g in self._idf:
                    weight[g] = max(weight.get(g, 0), w)
        total = sum(w * self._idf[g] for g, w in weight.items())
        if not total:
            return []

        hit, explained = defaultdict(float), defaultdict(float)
        for g, w in weight.items():
            for i in self._index[g]:
                hit[i] += self._idf[g]
                explained[i] += w * self._idf[g]

        scored = []
        for i, h in hit.items():
            cover, explain = h / self._total[i], explained[i] / total
            scored.append(((1 + self.BETA2) * cover * explain / (self.BETA2 * explain + cover), i))
        scored.sort(key=lambda s: (-s[0], len(self.names[s[1]])))
        return [{"name": self.names[i], "score": round(s, 3)} for s, i in scored[:top]]
