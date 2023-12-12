import { Statement } from "delib-npm";
import { FC } from "react";
import { updateStatementText } from "../../../functions/db/statements/setStatments";
import styles from "./EditTitle.module.scss";
import Text from "../text/Text";
import useDirection from "../../../functions/hooks/useDirection";

interface Props {
    statement: Statement | undefined;
    isEdit: boolean;
    setEdit: Function;
    isTextArea?: boolean;
}

const EditTitle: FC<Props> = ({ statement, isEdit, setEdit, isTextArea }) => {
    try {
        if (!statement) return null;

        const _direction = useDirection();
        const direction = _direction === "row" ? "ltr" : "rtl";
        const align = _direction === "row" ? "left" : "right";

        const title = statement.statement.split("\n")[0];
        const description = statement.statement.split("\n").slice(1).join("\n");

        function handleSetTitle(e: any) {
            try {
                if (
                    e.type === "blur" ||
                    (e.key === "Enter" && e.shiftKey === false)
                ) {
                    const inputString = e.target.value;

                    if (inputString === title) return setEdit(false);
                    if (!inputString) return;

                    if (!statement) throw new Error("statement is undefined");

                    if (isTextArea) {
                        updateStatementText(statement, e.target.value);
                    } else {
                        const statementTitle = inputString + "\n" + description;
                        //update title in db
                        updateStatementText(statement, statementTitle);
                    }

                    setEdit(false);
                }
            } catch (error) {
                console.error(error);
            }
        }
        if (!isEdit)
            return (
                <div style={{ direction: direction, textAlign: align }}>
                    <Text text={statement.statement} />
                </div>
            );

        if (isTextArea)
            return (
                <textarea
                    className={styles.textarea}
                    defaultValue={statement.statement}
                    onBlur={handleSetTitle}
                    onKeyUp={handleSetTitle}
                />
            );

        return (
            <input
                className={styles.input}
                type="text"
                defaultValue={title}
                onBlur={handleSetTitle}
                onKeyUp={handleSetTitle}
            />
        );
    } catch (error) {
        console.error(error);
        return null;
    }
};

export default EditTitle;
