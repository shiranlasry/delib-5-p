import { FC } from "react";

// Third party imports
import { useNavigate, useParams } from "react-router-dom";
import { Statement } from "delib-npm";

// Firestore functions

// Custom components
import UploadImage from "../../../../../../components/uploadImage/UploadImage";
import DisplayResultsBy from "./../../components/displayResultsBy/DisplayResultsBy";
import ResultsRange from "./../../components/resultsRange/ResultsRange";
import GetVoters from "./../../components/GetVoters";
import GetEvaluators from "./../../components/GetEvaluators";
import TabsToDisplay from "./../../components/tabsToDisplaySwitches/TabsToDisplay";

// Hooks & Helpers
import { handleSetStatement } from "./../../statementSettingsCont";
import { useLanguage } from "../../../../../../../functions/hooks/useLanguages";
import TitleAndDescription from "./../../components/titleAndDescription/TitleAndDescription";
import AdvancedSettings from "./../../components/advancedSettings/AdvancedSettings";
import MembersSettings from "./../../components/membership/MembersSettings";
import SectionTitle from "./../../components/sectionTitle/SectionTitle";
import "./StatementSettingsForm.scss";

interface StatementSettingsFormProps {
    setIsLoading: (isLoading: boolean) => void;
    statement: Statement | undefined;
}

const StatementSettingsForm: FC<StatementSettingsFormProps> = ({
    setIsLoading,
    statement,
}) => {
    // * Hooks * //
    const navigate = useNavigate();
    const { statementId } = useParams();
    const { t } = useLanguage();

    // * Functions * //
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setIsLoading(true);
        await handleSetStatement(e, navigate, statementId, statement);

        setIsLoading(false);
    };

    const isNewStatement = !statementId;

    return (
        <form
            onSubmit={handleSubmit}
            className="statement-settings-form"
            data-cy="statement-settings-form"
        >
            <TitleAndDescription statement={statement} />
            <SectionTitle title={t("General Settings")} />
            <section className="switches-area">
                <TabsToDisplay statement={statement} />
                <AdvancedSettings statement={statement} />
            </section>
            <DisplayResultsBy statement={statement} />
            <ResultsRange statement={statement} />

            {!isNewStatement && (
                <>
                    <UploadImage statement={statement} />
                    <SectionTitle title={t("Members")} />
                    <MembersSettings statement={statement} />
                    <section className="get-members-area">
                        <GetVoters statementId={statementId} />
                    </section>
                    <section className="get-members-area">
                        <GetEvaluators statementId={statementId} />
                    </section>
                </>
            )}

            <button
                type="submit"
                className="submit-button"
                data-cy="settings-statement-submit-btn"
            >
                {t(isNewStatement ? "Add" : "Update")}
            </button>
        </form>
    );
};

export default StatementSettingsForm;
