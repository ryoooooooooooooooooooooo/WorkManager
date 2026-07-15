export const getWork = (req, res) => {
    // 後で使う
    const work = {
        id: 1,
        name: "課題１",
        limit: "2027/01/01",
        subjectId: "1",
    };

    res.json(work);
};