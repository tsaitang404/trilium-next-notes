import handleParens from "../../src/services/search/services/handle_parens.js";
import { TokenStructure } from "../../src/services/search/services/types.js";

describe("Parens handler", () => {
    it("handles parens", () => {
        const input = ["(", "hello", ")", "and", "(", "(", "pick", "one", ")", "and", "another", ")"]
            .map(token => ({token}));

        const actual: TokenStructure = [
            [
                {token: "hello"}
            ],
            {token: "and"},
            [
                [
                    {token: "pick"},
                    {token: "one"}
                ],
                {token: "and"},
                {token: "another"}
            ]
        ];

        expect(handleParens(input)).toEqual(actual);
    });
});
