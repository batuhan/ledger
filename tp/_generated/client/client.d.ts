export type Id<Kind extends string = string> = number & {
	readonly __tp_kind?: Kind;
};
export type Role = "guest" | "subscriber" | "author" | "editor" | "admin";
export interface User {
	id: number;
	name: string;
	role: Role;
}
export interface Media {
	id: number;
	url: string;
	mime: string;
	size: number;
	width: number | null;
	height: number | null;
	alt: string | null;
	filename: string;
	createdAt: string;
	sizes: Record<string, {
		url: string;
		width: number;
		height: number;
	}>;
	focal: {
		x: number;
		y: number;
	} | null;
	author: number | null;
	caption: string;
}
export interface PrivateFile {
	id: number;
	bucket: string;
	filename: string;
	mime: string;
	size: number;
	ownerId: number | null;
	createdAt: string;
	url: string;
}
export interface RevisionSummary {
	id: number;
	version: number;
	op: "create" | "update" | "delete" | "restore" | "purge";
	at: string;
	user: {
		id: number;
		name: string;
	} | null;
	schemaMigration: string | null;
	changed: string[] | null;
}
export interface RevisionDiff<T = Record<string, unknown>> {
	from: number;
	to: number;
	changes: {
		field: keyof T & string;
		from: unknown;
		to: unknown;
	}[];
}
export type Status = "draft" | "published" | "scheduled";
export type Locale = never;
export interface LegalEntity {
	id: Id<"legalEntities">;
	name: string;
	slug: string | null;
	country: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
	entityType: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust";
	baseCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	taxId: string | null;
	vatNumber: string | null;
	notes: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface LegalEntityInsert {
	name: string;
	slug?: string | null;
	country?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
	entityType?: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust";
	baseCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	taxId?: string | null;
	vatNumber?: string | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface LegalEntityPatch {
	name?: string;
	slug?: string | null;
	country?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
	entityType?: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust";
	baseCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	taxId?: string | null;
	vatNumber?: string | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface LegalEntityWith {
	accounts?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	cards?: true | {
		where?: CardFilter;
		orderBy?: CardOrder;
		limit?: number;
		offset?: number;
		with?: CardWith;
	};
	categories?: true | {
		where?: CategoryFilter;
		orderBy?: CategoryOrder;
		limit?: number;
		offset?: number;
		with?: CategoryWith;
	};
	recurringItems?: true | {
		where?: RecurringItemFilter;
		orderBy?: RecurringItemOrder;
		limit?: number;
		offset?: number;
		with?: RecurringItemWith;
	};
	ingestItems?: true | {
		where?: IngestItemFilter;
		orderBy?: IngestItemOrder;
		limit?: number;
		offset?: number;
		with?: IngestItemWith;
	};
	financeMemos?: true | {
		where?: FinanceMemoFilter;
		orderBy?: FinanceMemoOrder;
		limit?: number;
		offset?: number;
		with?: FinanceMemoWith;
	};
	installmentPlans?: true | {
		where?: InstallmentPlanFilter;
		orderBy?: InstallmentPlanOrder;
		limit?: number;
		offset?: number;
		with?: InstallmentPlanWith;
	};
	entries?: true | {
		where?: EntryFilter;
		orderBy?: EntryOrder;
		limit?: number;
		offset?: number;
		with?: EntryWith;
	};
	trades?: true | {
		where?: TradeFilter;
		orderBy?: TradeOrder;
		limit?: number;
		offset?: number;
		with?: TradeWith;
	};
	valuations?: true | {
		where?: ValuationFilter;
		orderBy?: ValuationOrder;
		limit?: number;
		offset?: number;
		with?: ValuationWith;
	};
	ingestProposals?: true | {
		where?: IngestProposalFilter;
		orderBy?: IngestProposalOrder;
		limit?: number;
		offset?: number;
		with?: IngestProposalWith;
	};
	grants?: true | {
		where?: GrantFilter;
		orderBy?: GrantOrder;
		limit?: number;
		offset?: number;
		with?: GrantWith;
	};
	invitations?: true | {
		where?: InvitationFilter;
		orderBy?: InvitationOrder;
		limit?: number;
		offset?: number;
		with?: InvitationWith;
	};
	shareLinks?: true | {
		where?: ShareLinkFilter;
		orderBy?: ShareLinkOrder;
		limit?: number;
		offset?: number;
		with?: ShareLinkWith;
	};
}
export interface LegalEntityFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	name?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	country?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null | {
		eq?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null;
		ne?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null;
		gt?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		gte?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		lt?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		lte?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		in?: ("NL" | "TR" | "US" | "GB" | "EU" | "OTHER")[];
		notIn?: ("NL" | "TR" | "US" | "GB" | "EU" | "OTHER")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	entityType?: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust" | null | {
		eq?: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust" | null;
		ne?: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust" | null;
		gt?: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust";
		gte?: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust";
		lt?: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust";
		lte?: "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust";
		in?: ("personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust")[];
		notIn?: ("personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	baseCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	taxId?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	vatNumber?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	accounts?: true | AccountFilter;
	cards?: true | CardFilter;
	categories?: true | CategoryFilter;
	recurringItems?: true | RecurringItemFilter;
	ingestItems?: true | IngestItemFilter;
	financeMemos?: true | FinanceMemoFilter;
	installmentPlans?: true | InstallmentPlanFilter;
	entries?: true | EntryFilter;
	trades?: true | TradeFilter;
	valuations?: true | ValuationFilter;
	ingestProposals?: true | IngestProposalFilter;
	grants?: true | GrantFilter;
	invitations?: true | InvitationFilter;
	shareLinks?: true | ShareLinkFilter;
	AND?: LegalEntityFilter[];
	OR?: LegalEntityFilter[];
	NOT?: LegalEntityFilter;
}
export type LegalEntityOrder = Partial<Record<"id" | "name" | "slug" | "country" | "entityType" | "baseCurrency" | "taxId" | "vatNumber" | "notes" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Institution {
	id: Id<"institutions">;
	name: string;
	slug: string | null;
	country: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
	kind: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto";
	website: string | null;
	notes: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface InstitutionInsert {
	name: string;
	slug?: string | null;
	country?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
	kind?: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto";
	website?: string | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface InstitutionPatch {
	name?: string;
	slug?: string | null;
	country?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
	kind?: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto";
	website?: string | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface InstitutionWith {
	accounts?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
}
export interface InstitutionFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	name?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	country?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null | {
		eq?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null;
		ne?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null;
		gt?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		gte?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		lt?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		lte?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		in?: ("NL" | "TR" | "US" | "GB" | "EU" | "OTHER")[];
		notIn?: ("NL" | "TR" | "US" | "GB" | "EU" | "OTHER")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	kind?: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto" | null | {
		eq?: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto" | null;
		ne?: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto" | null;
		gt?: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto";
		gte?: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto";
		lt?: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto";
		lte?: "bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto";
		in?: ("bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto")[];
		notIn?: ("bank" | "neobank" | "emoney" | "broker" | "credit_card" | "crypto")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	website?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	accounts?: true | AccountFilter;
	AND?: InstitutionFilter[];
	OR?: InstitutionFilter[];
	NOT?: InstitutionFilter;
}
export type InstitutionOrder = Partial<Record<"id" | "name" | "slug" | "country" | "kind" | "website" | "notes" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Account {
	id: Id<"accounts">;
	name: string;
	slug: string | null;
	entityId: Id<"legalEntities">;
	institutionId: Id<"institutions">;
	parentAccountId: number | null;
	accountType: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot";
	currency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	ibanOrMask: string | null;
	balanceMinor: number;
	creditLimitMinor: number | null;
	statementCloseDay: number | null;
	paymentDueDay: number | null;
	excludeFromTotals: boolean;
	archived: boolean;
	notes: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface AccountInsert {
	name: string;
	slug?: string | null;
	entityId: Id<"legalEntities">;
	institutionId: Id<"institutions">;
	parentAccountId?: number | null;
	accountType?: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot";
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	ibanOrMask?: string | null;
	balanceMinor?: number;
	creditLimitMinor?: number | null;
	statementCloseDay?: number | null;
	paymentDueDay?: number | null;
	excludeFromTotals?: boolean;
	archived?: boolean;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface AccountPatch {
	name?: string;
	slug?: string | null;
	entityId?: number;
	institutionId?: number;
	parentAccountId?: number | null;
	accountType?: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot";
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	ibanOrMask?: string | null;
	balanceMinor?: number;
	creditLimitMinor?: number | null;
	statementCloseDay?: number | null;
	paymentDueDay?: number | null;
	excludeFromTotals?: boolean;
	archived?: boolean;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface AccountWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	institutionId?: true | {
		where?: InstitutionFilter;
		orderBy?: InstitutionOrder;
		limit?: number;
		offset?: number;
		with?: InstitutionWith;
	};
	cards?: true | {
		where?: CardFilter;
		orderBy?: CardOrder;
		limit?: number;
		offset?: number;
		with?: CardWith;
	};
	recurringItems?: true | {
		where?: RecurringItemFilter;
		orderBy?: RecurringItemOrder;
		limit?: number;
		offset?: number;
		with?: RecurringItemWith;
	};
	ingestItems?: true | {
		where?: IngestItemFilter;
		orderBy?: IngestItemOrder;
		limit?: number;
		offset?: number;
		with?: IngestItemWith;
	};
	installmentPlans?: true | {
		where?: InstallmentPlanFilter;
		orderBy?: InstallmentPlanOrder;
		limit?: number;
		offset?: number;
		with?: InstallmentPlanWith;
	};
	entries?: true | {
		where?: EntryFilter;
		orderBy?: EntryOrder;
		limit?: number;
		offset?: number;
		with?: EntryWith;
	};
	trades?: true | {
		where?: TradeFilter;
		orderBy?: TradeOrder;
		limit?: number;
		offset?: number;
		with?: TradeWith;
	};
	valuations?: true | {
		where?: ValuationFilter;
		orderBy?: ValuationOrder;
		limit?: number;
		offset?: number;
		with?: ValuationWith;
	};
	ingestProposals?: true | {
		where?: IngestProposalFilter;
		orderBy?: IngestProposalOrder;
		limit?: number;
		offset?: number;
		with?: IngestProposalWith;
	};
	grants?: true | {
		where?: GrantFilter;
		orderBy?: GrantOrder;
		limit?: number;
		offset?: number;
		with?: GrantWith;
	};
	shareLinks?: true | {
		where?: ShareLinkFilter;
		orderBy?: ShareLinkOrder;
		limit?: number;
		offset?: number;
		with?: ShareLinkWith;
	};
}
export interface AccountFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	name?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	institutionId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | InstitutionFilter;
	parentAccountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	accountType?: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot" | null | {
		eq?: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot" | null;
		ne?: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot" | null;
		gt?: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot";
		gte?: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot";
		lt?: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot";
		lte?: "checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot";
		in?: ("checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot")[];
		notIn?: ("checking" | "savings" | "credit_card" | "brokerage" | "cash" | "loan" | "virtual_pot")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	ibanOrMask?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	balanceMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	creditLimitMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	statementCloseDay?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	paymentDueDay?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	excludeFromTotals?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	archived?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	cards?: true | CardFilter;
	recurringItems?: true | RecurringItemFilter;
	ingestItems?: true | IngestItemFilter;
	installmentPlans?: true | InstallmentPlanFilter;
	entries?: true | EntryFilter;
	trades?: true | TradeFilter;
	valuations?: true | ValuationFilter;
	ingestProposals?: true | IngestProposalFilter;
	grants?: true | GrantFilter;
	shareLinks?: true | ShareLinkFilter;
	AND?: AccountFilter[];
	OR?: AccountFilter[];
	NOT?: AccountFilter;
}
export type AccountOrder = Partial<Record<"id" | "name" | "slug" | "entityId" | "institutionId" | "parentAccountId" | "accountType" | "currency" | "ibanOrMask" | "balanceMinor" | "creditLimitMinor" | "statementCloseDay" | "paymentDueDay" | "excludeFromTotals" | "archived" | "notes" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Card {
	id: Id<"cards">;
	name: string;
	slug: string | null;
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	cardType: "debit" | "credit" | "virtual" | "prepaid";
	network: "visa" | "mastercard" | "amex" | "troy";
	last4: string;
	currency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	monthlyLimitMinor: number | null;
	expiresOn: string | null;
	cardState: "active" | "frozen" | "cancelled";
	notes: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface CardInsert {
	name: string;
	slug?: string | null;
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	cardType?: "debit" | "credit" | "virtual" | "prepaid";
	network?: "visa" | "mastercard" | "amex" | "troy";
	last4: string;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	monthlyLimitMinor?: number | null;
	expiresOn?: string | null;
	cardState?: "active" | "frozen" | "cancelled";
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface CardPatch {
	name?: string;
	slug?: string | null;
	entityId?: number;
	accountId?: number;
	cardType?: "debit" | "credit" | "virtual" | "prepaid";
	network?: "visa" | "mastercard" | "amex" | "troy";
	last4?: string;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	monthlyLimitMinor?: number | null;
	expiresOn?: string | null;
	cardState?: "active" | "frozen" | "cancelled";
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface CardWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	accountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	installmentPlans?: true | {
		where?: InstallmentPlanFilter;
		orderBy?: InstallmentPlanOrder;
		limit?: number;
		offset?: number;
		with?: InstallmentPlanWith;
	};
	entries?: true | {
		where?: EntryFilter;
		orderBy?: EntryOrder;
		limit?: number;
		offset?: number;
		with?: EntryWith;
	};
}
export interface CardFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	name?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	accountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	cardType?: "debit" | "credit" | "virtual" | "prepaid" | null | {
		eq?: "debit" | "credit" | "virtual" | "prepaid" | null;
		ne?: "debit" | "credit" | "virtual" | "prepaid" | null;
		gt?: "debit" | "credit" | "virtual" | "prepaid";
		gte?: "debit" | "credit" | "virtual" | "prepaid";
		lt?: "debit" | "credit" | "virtual" | "prepaid";
		lte?: "debit" | "credit" | "virtual" | "prepaid";
		in?: ("debit" | "credit" | "virtual" | "prepaid")[];
		notIn?: ("debit" | "credit" | "virtual" | "prepaid")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	network?: "visa" | "mastercard" | "amex" | "troy" | null | {
		eq?: "visa" | "mastercard" | "amex" | "troy" | null;
		ne?: "visa" | "mastercard" | "amex" | "troy" | null;
		gt?: "visa" | "mastercard" | "amex" | "troy";
		gte?: "visa" | "mastercard" | "amex" | "troy";
		lt?: "visa" | "mastercard" | "amex" | "troy";
		lte?: "visa" | "mastercard" | "amex" | "troy";
		in?: ("visa" | "mastercard" | "amex" | "troy")[];
		notIn?: ("visa" | "mastercard" | "amex" | "troy")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	last4?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	monthlyLimitMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	expiresOn?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	cardState?: "active" | "frozen" | "cancelled" | null | {
		eq?: "active" | "frozen" | "cancelled" | null;
		ne?: "active" | "frozen" | "cancelled" | null;
		gt?: "active" | "frozen" | "cancelled";
		gte?: "active" | "frozen" | "cancelled";
		lt?: "active" | "frozen" | "cancelled";
		lte?: "active" | "frozen" | "cancelled";
		in?: ("active" | "frozen" | "cancelled")[];
		notIn?: ("active" | "frozen" | "cancelled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	installmentPlans?: true | InstallmentPlanFilter;
	entries?: true | EntryFilter;
	AND?: CardFilter[];
	OR?: CardFilter[];
	NOT?: CardFilter;
}
export type CardOrder = Partial<Record<"id" | "name" | "slug" | "entityId" | "accountId" | "cardType" | "network" | "last4" | "currency" | "monthlyLimitMinor" | "expiresOn" | "cardState" | "notes" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Category {
	id: Id<"categories">;
	name: string;
	slug: string | null;
	entityId: Id<"legalEntities"> | null;
	parentCategoryId: number | null;
	groupName: string;
	isIncome: boolean;
	excludeFromBudget: boolean;
	excludeFromTotals: boolean;
	accountCode: string | null;
	vatRateBps: number;
	monthlyBudgetMinor: number | null;
	notes: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface CategoryInsert {
	name: string;
	slug?: string | null;
	entityId?: Id<"legalEntities"> | null;
	parentCategoryId?: number | null;
	groupName?: string;
	isIncome?: boolean;
	excludeFromBudget?: boolean;
	excludeFromTotals?: boolean;
	accountCode?: string | null;
	vatRateBps?: number;
	monthlyBudgetMinor?: number | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface CategoryPatch {
	name?: string;
	slug?: string | null;
	entityId?: number | null;
	parentCategoryId?: number | null;
	groupName?: string;
	isIncome?: boolean;
	excludeFromBudget?: boolean;
	excludeFromTotals?: boolean;
	accountCode?: string | null;
	vatRateBps?: number;
	monthlyBudgetMinor?: number | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface CategoryWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	payees?: true | {
		where?: PayeeFilter;
		orderBy?: PayeeOrder;
		limit?: number;
		offset?: number;
		with?: PayeeWith;
	};
	recurringItems?: true | {
		where?: RecurringItemFilter;
		orderBy?: RecurringItemOrder;
		limit?: number;
		offset?: number;
		with?: RecurringItemWith;
	};
	installmentPlans?: true | {
		where?: InstallmentPlanFilter;
		orderBy?: InstallmentPlanOrder;
		limit?: number;
		offset?: number;
		with?: InstallmentPlanWith;
	};
	entries?: true | {
		where?: EntryFilter;
		orderBy?: EntryOrder;
		limit?: number;
		offset?: number;
		with?: EntryWith;
	};
	ingestProposals?: true | {
		where?: IngestProposalFilter;
		orderBy?: IngestProposalOrder;
		limit?: number;
		offset?: number;
		with?: IngestProposalWith;
	};
}
export interface CategoryFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	name?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	parentCategoryId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	groupName?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	isIncome?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	excludeFromBudget?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	excludeFromTotals?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	accountCode?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	vatRateBps?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	monthlyBudgetMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	payees?: true | PayeeFilter;
	recurringItems?: true | RecurringItemFilter;
	installmentPlans?: true | InstallmentPlanFilter;
	entries?: true | EntryFilter;
	ingestProposals?: true | IngestProposalFilter;
	AND?: CategoryFilter[];
	OR?: CategoryFilter[];
	NOT?: CategoryFilter;
}
export type CategoryOrder = Partial<Record<"id" | "name" | "slug" | "entityId" | "parentCategoryId" | "groupName" | "isIncome" | "excludeFromBudget" | "excludeFromTotals" | "accountCode" | "vatRateBps" | "monthlyBudgetMinor" | "notes" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Payee {
	id: Id<"payees">;
	name: string;
	slug: string | null;
	defaultCategoryId: Id<"categories"> | null;
	country: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null;
	vatNumber: string | null;
	notes: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface PayeeInsert {
	name: string;
	slug?: string | null;
	defaultCategoryId?: Id<"categories"> | null;
	country?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null;
	vatNumber?: string | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface PayeePatch {
	name?: string;
	slug?: string | null;
	defaultCategoryId?: number | null;
	country?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null;
	vatNumber?: string | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface PayeeWith {
	defaultCategoryId?: true | {
		where?: CategoryFilter;
		orderBy?: CategoryOrder;
		limit?: number;
		offset?: number;
		with?: CategoryWith;
	};
	recurringItems?: true | {
		where?: RecurringItemFilter;
		orderBy?: RecurringItemOrder;
		limit?: number;
		offset?: number;
		with?: RecurringItemWith;
	};
	entries?: true | {
		where?: EntryFilter;
		orderBy?: EntryOrder;
		limit?: number;
		offset?: number;
		with?: EntryWith;
	};
}
export interface PayeeFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	name?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	defaultCategoryId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | CategoryFilter;
	country?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null | {
		eq?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null;
		ne?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER" | null;
		gt?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		gte?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		lt?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		lte?: "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";
		in?: ("NL" | "TR" | "US" | "GB" | "EU" | "OTHER")[];
		notIn?: ("NL" | "TR" | "US" | "GB" | "EU" | "OTHER")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	vatNumber?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	recurringItems?: true | RecurringItemFilter;
	entries?: true | EntryFilter;
	AND?: PayeeFilter[];
	OR?: PayeeFilter[];
	NOT?: PayeeFilter;
}
export type PayeeOrder = Partial<Record<"id" | "name" | "slug" | "defaultCategoryId" | "country" | "vatNumber" | "notes" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface RecurringItem {
	id: Id<"recurringItems">;
	name: string;
	slug: string | null;
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	categoryId: Id<"categories"> | null;
	payeeId: Id<"payees"> | null;
	amountMinor: number;
	currency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	cadence: "weekly" | "monthly" | "quarterly" | "yearly";
	billingDay: number;
	nextDueOn: string;
	autoPay: boolean;
	scheduleState: "active" | "paused" | "cancelled";
	notes: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface RecurringItemInsert {
	name: string;
	slug?: string | null;
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	categoryId?: Id<"categories"> | null;
	payeeId?: Id<"payees"> | null;
	amountMinor: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	cadence?: "weekly" | "monthly" | "quarterly" | "yearly";
	billingDay?: number;
	nextDueOn: string;
	autoPay?: boolean;
	scheduleState?: "active" | "paused" | "cancelled";
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface RecurringItemPatch {
	name?: string;
	slug?: string | null;
	entityId?: number;
	accountId?: number;
	categoryId?: number | null;
	payeeId?: number | null;
	amountMinor?: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	cadence?: "weekly" | "monthly" | "quarterly" | "yearly";
	billingDay?: number;
	nextDueOn?: string;
	autoPay?: boolean;
	scheduleState?: "active" | "paused" | "cancelled";
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface RecurringItemWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	accountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	categoryId?: true | {
		where?: CategoryFilter;
		orderBy?: CategoryOrder;
		limit?: number;
		offset?: number;
		with?: CategoryWith;
	};
	payeeId?: true | {
		where?: PayeeFilter;
		orderBy?: PayeeOrder;
		limit?: number;
		offset?: number;
		with?: PayeeWith;
	};
}
export interface RecurringItemFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	name?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	accountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	categoryId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | CategoryFilter;
	payeeId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | PayeeFilter;
	amountMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	cadence?: "weekly" | "monthly" | "quarterly" | "yearly" | null | {
		eq?: "weekly" | "monthly" | "quarterly" | "yearly" | null;
		ne?: "weekly" | "monthly" | "quarterly" | "yearly" | null;
		gt?: "weekly" | "monthly" | "quarterly" | "yearly";
		gte?: "weekly" | "monthly" | "quarterly" | "yearly";
		lt?: "weekly" | "monthly" | "quarterly" | "yearly";
		lte?: "weekly" | "monthly" | "quarterly" | "yearly";
		in?: ("weekly" | "monthly" | "quarterly" | "yearly")[];
		notIn?: ("weekly" | "monthly" | "quarterly" | "yearly")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	billingDay?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	nextDueOn?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	autoPay?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	scheduleState?: "active" | "paused" | "cancelled" | null | {
		eq?: "active" | "paused" | "cancelled" | null;
		ne?: "active" | "paused" | "cancelled" | null;
		gt?: "active" | "paused" | "cancelled";
		gte?: "active" | "paused" | "cancelled";
		lt?: "active" | "paused" | "cancelled";
		lte?: "active" | "paused" | "cancelled";
		in?: ("active" | "paused" | "cancelled")[];
		notIn?: ("active" | "paused" | "cancelled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: RecurringItemFilter[];
	OR?: RecurringItemFilter[];
	NOT?: RecurringItemFilter;
}
export type RecurringItemOrder = Partial<Record<"id" | "name" | "slug" | "entityId" | "accountId" | "categoryId" | "payeeId" | "amountMinor" | "currency" | "cadence" | "billingDay" | "nextDueOn" | "autoPay" | "scheduleState" | "notes" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Security {
	id: Id<"securities">;
	name: string;
	slug: string | null;
	ticker: string;
	isin: string | null;
	assetClass: "stock" | "etf" | "bond" | "fund" | "money_market";
	currency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	lastPriceMinor: number;
	lastPricedOn: string | null;
	notes: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface SecurityInsert {
	name: string;
	slug?: string | null;
	ticker: string;
	isin?: string | null;
	assetClass?: "stock" | "etf" | "bond" | "fund" | "money_market";
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	lastPriceMinor?: number;
	lastPricedOn?: string | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface SecurityPatch {
	name?: string;
	slug?: string | null;
	ticker?: string;
	isin?: string | null;
	assetClass?: "stock" | "etf" | "bond" | "fund" | "money_market";
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	lastPriceMinor?: number;
	lastPricedOn?: string | null;
	notes?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface SecurityWith {
	trades?: true | {
		where?: TradeFilter;
		orderBy?: TradeOrder;
		limit?: number;
		offset?: number;
		with?: TradeWith;
	};
}
export interface SecurityFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	name?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	ticker?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	isin?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	assetClass?: "stock" | "etf" | "bond" | "fund" | "money_market" | null | {
		eq?: "stock" | "etf" | "bond" | "fund" | "money_market" | null;
		ne?: "stock" | "etf" | "bond" | "fund" | "money_market" | null;
		gt?: "stock" | "etf" | "bond" | "fund" | "money_market";
		gte?: "stock" | "etf" | "bond" | "fund" | "money_market";
		lt?: "stock" | "etf" | "bond" | "fund" | "money_market";
		lte?: "stock" | "etf" | "bond" | "fund" | "money_market";
		in?: ("stock" | "etf" | "bond" | "fund" | "money_market")[];
		notIn?: ("stock" | "etf" | "bond" | "fund" | "money_market")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	lastPriceMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	lastPricedOn?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	trades?: true | TradeFilter;
	AND?: SecurityFilter[];
	OR?: SecurityFilter[];
	NOT?: SecurityFilter;
}
export type SecurityOrder = Partial<Record<"id" | "name" | "slug" | "ticker" | "isin" | "assetClass" | "currency" | "lastPriceMinor" | "lastPricedOn" | "notes" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface IngestItem {
	id: Id<"ingestItems">;
	title: string;
	slug: string | null;
	entityId: Id<"legalEntities"> | null;
	accountId: Id<"accounts"> | null;
	fileId: number | null;
	sourceKind: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other";
	ingestState: "uploaded" | "processing" | "needs_review" | "applied" | "failed";
	detectedInstitution: string | null;
	detectedCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
	proposalCount: number;
	errorMessage: string | null;
	summary: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface IngestItemInsert {
	title: string;
	slug?: string | null;
	entityId?: Id<"legalEntities"> | null;
	accountId?: Id<"accounts"> | null;
	fileId?: number | null;
	sourceKind?: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other";
	ingestState?: "uploaded" | "processing" | "needs_review" | "applied" | "failed";
	detectedInstitution?: string | null;
	detectedCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
	proposalCount?: number;
	errorMessage?: string | null;
	summary?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface IngestItemPatch {
	title?: string;
	slug?: string | null;
	entityId?: number | null;
	accountId?: number | null;
	fileId?: number | null;
	sourceKind?: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other";
	ingestState?: "uploaded" | "processing" | "needs_review" | "applied" | "failed";
	detectedInstitution?: string | null;
	detectedCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
	proposalCount?: number;
	errorMessage?: string | null;
	summary?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface IngestItemWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	accountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	proposals?: true | {
		where?: IngestProposalFilter;
		orderBy?: IngestProposalOrder;
		limit?: number;
		offset?: number;
		with?: IngestProposalWith;
	};
	fileId?: true;
}
export interface IngestItemFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	title?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	accountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	fileId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	sourceKind?: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other" | null | {
		eq?: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other" | null;
		ne?: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other" | null;
		gt?: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other";
		gte?: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other";
		lt?: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other";
		lte?: "bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other";
		in?: ("bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other")[];
		notIn?: ("bank_csv" | "credit_card_pdf" | "receipt_image" | "invoice_pdf" | "broker_statement" | "other")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	ingestState?: "uploaded" | "processing" | "needs_review" | "applied" | "failed" | null | {
		eq?: "uploaded" | "processing" | "needs_review" | "applied" | "failed" | null;
		ne?: "uploaded" | "processing" | "needs_review" | "applied" | "failed" | null;
		gt?: "uploaded" | "processing" | "needs_review" | "applied" | "failed";
		gte?: "uploaded" | "processing" | "needs_review" | "applied" | "failed";
		lt?: "uploaded" | "processing" | "needs_review" | "applied" | "failed";
		lte?: "uploaded" | "processing" | "needs_review" | "applied" | "failed";
		in?: ("uploaded" | "processing" | "needs_review" | "applied" | "failed")[];
		notIn?: ("uploaded" | "processing" | "needs_review" | "applied" | "failed")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	detectedInstitution?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	detectedCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	proposalCount?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	errorMessage?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	summary?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	proposals?: true | IngestProposalFilter;
	AND?: IngestItemFilter[];
	OR?: IngestItemFilter[];
	NOT?: IngestItemFilter;
}
export type IngestItemOrder = Partial<Record<"id" | "title" | "slug" | "entityId" | "accountId" | "fileId" | "sourceKind" | "ingestState" | "detectedInstitution" | "detectedCurrency" | "proposalCount" | "errorMessage" | "summary" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface FinanceMemo {
	id: Id<"financeMemos">;
	title: string;
	slug: string | null;
	entityId: Id<"legalEntities"> | null;
	period: string;
	tagIds: Id<"tags">[];
	content: string | null;
	status: "draft" | "published" | "scheduled";
	publishedAt: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface FinanceMemoInsert {
	title: string;
	slug?: string | null;
	entityId?: Id<"legalEntities"> | null;
	period?: string;
	tagIds?: Id<"tags">[];
	content?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface FinanceMemoPatch {
	title?: string;
	slug?: string | null;
	entityId?: number | null;
	period?: string;
	tagIds?: number[];
	content?: string | null;
	status?: "draft" | "published" | "scheduled";
	publishedAt?: string | null;
}
export interface FinanceMemoWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	tagIds?: true | {
		where?: TagFilter;
		orderBy?: TagOrder;
		limit?: number;
		offset?: number;
		with?: TagWith;
	};
}
export interface FinanceMemoFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	title?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	period?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	tagIds?: [] | {
		has?: number;
		eq?: [];
		NOT?: {
			has?: number;
		};
	} | true | false | TagFilter;
	content?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	status?: "draft" | "published" | "scheduled" | null | {
		eq?: "draft" | "published" | "scheduled" | null;
		ne?: "draft" | "published" | "scheduled" | null;
		gt?: "draft" | "published" | "scheduled";
		gte?: "draft" | "published" | "scheduled";
		lt?: "draft" | "published" | "scheduled";
		lte?: "draft" | "published" | "scheduled";
		in?: ("draft" | "published" | "scheduled")[];
		notIn?: ("draft" | "published" | "scheduled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	publishedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: FinanceMemoFilter[];
	OR?: FinanceMemoFilter[];
	NOT?: FinanceMemoFilter;
}
export type FinanceMemoOrder = Partial<Record<"id" | "title" | "slug" | "entityId" | "period" | "content" | "status" | "publishedAt" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Transfer {
	id: Id<"transfers">;
	transferKind: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";
	fromAccountId: Id<"accounts">;
	toAccountId: Id<"accounts">;
	fromAmountMinor: number;
	fromCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	toAmountMinor: number;
	toCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	feeMinor: number;
	fxRateMicros: number;
	executedOn: string;
	reference: string | null;
	notes: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface TransferInsert {
	transferKind?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";
	fromAccountId: Id<"accounts">;
	toAccountId: Id<"accounts">;
	fromAmountMinor: number;
	fromCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	toAmountMinor: number;
	toCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	feeMinor?: number;
	fxRateMicros?: number;
	executedOn: string;
	reference?: string | null;
	notes?: string | null;
}
export interface TransferPatch {
	transferKind?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";
	fromAccountId?: number;
	toAccountId?: number;
	fromAmountMinor?: number;
	fromCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	toAmountMinor?: number;
	toCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	feeMinor?: number;
	fxRateMicros?: number;
	executedOn?: string;
	reference?: string | null;
	notes?: string | null;
}
export interface TransferWith {
	fromAccountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	toAccountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	entries?: true | {
		where?: EntryFilter;
		orderBy?: EntryOrder;
		limit?: number;
		offset?: number;
		with?: EntryWith;
	};
}
export interface TransferFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	transferKind?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding" | null | {
		eq?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding" | null;
		ne?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding" | null;
		gt?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";
		gte?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";
		lt?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";
		lte?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";
		in?: ("same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding")[];
		notIn?: ("same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	fromAccountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	toAccountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	fromAmountMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	fromCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	toAmountMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	toCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	feeMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	fxRateMicros?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	executedOn?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	reference?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	entries?: true | EntryFilter;
	AND?: TransferFilter[];
	OR?: TransferFilter[];
	NOT?: TransferFilter;
}
export type TransferOrder = Partial<Record<"id" | "transferKind" | "fromAccountId" | "toAccountId" | "fromAmountMinor" | "fromCurrency" | "toAmountMinor" | "toCurrency" | "feeMinor" | "fxRateMicros" | "executedOn" | "reference" | "notes" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface InstallmentPlan {
	id: Id<"installmentPlans">;
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	cardId: Id<"cards"> | null;
	categoryId: Id<"categories"> | null;
	merchant: string;
	totalMinor: number;
	currency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	totalInstallments: number;
	paidInstallments: number;
	monthlyMinor: number;
	startedOn: string;
	status: "active" | "completed" | "cancelled";
	notes: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface InstallmentPlanInsert {
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	cardId?: Id<"cards"> | null;
	categoryId?: Id<"categories"> | null;
	merchant: string;
	totalMinor: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	totalInstallments: number;
	paidInstallments?: number;
	monthlyMinor: number;
	startedOn: string;
	status?: "active" | "completed" | "cancelled";
	notes?: string | null;
}
export interface InstallmentPlanPatch {
	entityId?: number;
	accountId?: number;
	cardId?: number | null;
	categoryId?: number | null;
	merchant?: string;
	totalMinor?: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	totalInstallments?: number;
	paidInstallments?: number;
	monthlyMinor?: number;
	startedOn?: string;
	status?: "active" | "completed" | "cancelled";
	notes?: string | null;
}
export interface InstallmentPlanWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	accountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	cardId?: true | {
		where?: CardFilter;
		orderBy?: CardOrder;
		limit?: number;
		offset?: number;
		with?: CardWith;
	};
	categoryId?: true | {
		where?: CategoryFilter;
		orderBy?: CategoryOrder;
		limit?: number;
		offset?: number;
		with?: CategoryWith;
	};
	entries?: true | {
		where?: EntryFilter;
		orderBy?: EntryOrder;
		limit?: number;
		offset?: number;
		with?: EntryWith;
	};
}
export interface InstallmentPlanFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	accountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	cardId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | CardFilter;
	categoryId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | CategoryFilter;
	merchant?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	totalMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	totalInstallments?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	paidInstallments?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	monthlyMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	startedOn?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	status?: "active" | "completed" | "cancelled" | null | {
		eq?: "active" | "completed" | "cancelled" | null;
		ne?: "active" | "completed" | "cancelled" | null;
		gt?: "active" | "completed" | "cancelled";
		gte?: "active" | "completed" | "cancelled";
		lt?: "active" | "completed" | "cancelled";
		lte?: "active" | "completed" | "cancelled";
		in?: ("active" | "completed" | "cancelled")[];
		notIn?: ("active" | "completed" | "cancelled")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	entries?: true | EntryFilter;
	AND?: InstallmentPlanFilter[];
	OR?: InstallmentPlanFilter[];
	NOT?: InstallmentPlanFilter;
}
export type InstallmentPlanOrder = Partial<Record<"id" | "entityId" | "accountId" | "cardId" | "categoryId" | "merchant" | "totalMinor" | "currency" | "totalInstallments" | "paidInstallments" | "monthlyMinor" | "startedOn" | "status" | "notes" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Entry {
	id: Id<"entries">;
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	cardId: Id<"cards"> | null;
	categoryId: Id<"categories"> | null;
	payeeId: Id<"payees"> | null;
	parentEntryId: number | null;
	transferId: Id<"transfers"> | null;
	installmentPlanId: Id<"installmentPlans"> | null;
	postedOn: string;
	description: string;
	merchantRaw: string | null;
	amountMinor: number;
	currency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	baseAmountMinor: number;
	fxRateMicros: number;
	entryKind: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
	isPending: boolean;
	reviewStatus: "unreviewed" | "reviewed" | "flagged";
	isSplitParent: boolean;
	excludeFromBudget: boolean;
	excludeFromTotals: boolean;
	vatAmountMinor: number | null;
	receiptFileId: number | null;
	tagsJson: string[];
	externalRef: string | null;
	notes: string | null;
	createdAt: string;
	author: number | null;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface EntryInsert {
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	cardId?: Id<"cards"> | null;
	categoryId?: Id<"categories"> | null;
	payeeId?: Id<"payees"> | null;
	parentEntryId?: number | null;
	transferId?: Id<"transfers"> | null;
	installmentPlanId?: Id<"installmentPlans"> | null;
	postedOn: string;
	description: string;
	merchantRaw?: string | null;
	amountMinor: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	baseAmountMinor: number;
	fxRateMicros?: number;
	entryKind?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
	isPending?: boolean;
	reviewStatus?: "unreviewed" | "reviewed" | "flagged";
	isSplitParent?: boolean;
	excludeFromBudget?: boolean;
	excludeFromTotals?: boolean;
	vatAmountMinor?: number | null;
	receiptFileId?: number | null;
	tagsJson?: string[];
	externalRef?: string | null;
	notes?: string | null;
	createdAt?: string;
}
export interface EntryPatch {
	entityId?: number;
	accountId?: number;
	cardId?: number | null;
	categoryId?: number | null;
	payeeId?: number | null;
	parentEntryId?: number | null;
	transferId?: number | null;
	installmentPlanId?: number | null;
	postedOn?: string;
	description?: string;
	merchantRaw?: string | null;
	amountMinor?: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	baseAmountMinor?: number;
	fxRateMicros?: number;
	entryKind?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
	isPending?: boolean;
	reviewStatus?: "unreviewed" | "reviewed" | "flagged";
	isSplitParent?: boolean;
	excludeFromBudget?: boolean;
	excludeFromTotals?: boolean;
	vatAmountMinor?: number | null;
	receiptFileId?: number | null;
	tagsJson?: string[];
	externalRef?: string | null;
	notes?: string | null;
	createdAt?: string;
}
export interface EntryWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	accountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	cardId?: true | {
		where?: CardFilter;
		orderBy?: CardOrder;
		limit?: number;
		offset?: number;
		with?: CardWith;
	};
	categoryId?: true | {
		where?: CategoryFilter;
		orderBy?: CategoryOrder;
		limit?: number;
		offset?: number;
		with?: CategoryWith;
	};
	payeeId?: true | {
		where?: PayeeFilter;
		orderBy?: PayeeOrder;
		limit?: number;
		offset?: number;
		with?: PayeeWith;
	};
	transferId?: true | {
		where?: TransferFilter;
		orderBy?: TransferOrder;
		limit?: number;
		offset?: number;
		with?: TransferWith;
	};
	installmentPlanId?: true | {
		where?: InstallmentPlanFilter;
		orderBy?: InstallmentPlanOrder;
		limit?: number;
		offset?: number;
		with?: InstallmentPlanWith;
	};
	receiptFileId?: true;
}
export interface EntryFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	accountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	cardId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | CardFilter;
	categoryId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | CategoryFilter;
	payeeId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | PayeeFilter;
	parentEntryId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	transferId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | TransferFilter;
	installmentPlanId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | InstallmentPlanFilter;
	postedOn?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	description?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	merchantRaw?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	amountMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	baseAmountMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	fxRateMicros?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	entryKind?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment" | null | {
		eq?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment" | null;
		ne?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment" | null;
		gt?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
		gte?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
		lt?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
		lte?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
		in?: ("expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment")[];
		notIn?: ("expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	isPending?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	reviewStatus?: "unreviewed" | "reviewed" | "flagged" | null | {
		eq?: "unreviewed" | "reviewed" | "flagged" | null;
		ne?: "unreviewed" | "reviewed" | "flagged" | null;
		gt?: "unreviewed" | "reviewed" | "flagged";
		gte?: "unreviewed" | "reviewed" | "flagged";
		lt?: "unreviewed" | "reviewed" | "flagged";
		lte?: "unreviewed" | "reviewed" | "flagged";
		in?: ("unreviewed" | "reviewed" | "flagged")[];
		notIn?: ("unreviewed" | "reviewed" | "flagged")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	isSplitParent?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	excludeFromBudget?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	excludeFromTotals?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	vatAmountMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	receiptFileId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	tagsJson?: string[] | null | {
		eq?: string[] | null;
		ne?: string[] | null;
		isNull?: true;
		isNotNull?: true;
	};
	externalRef?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: EntryFilter[];
	OR?: EntryFilter[];
	NOT?: EntryFilter;
}
export type EntryOrder = Partial<Record<"id" | "entityId" | "accountId" | "cardId" | "categoryId" | "payeeId" | "parentEntryId" | "transferId" | "installmentPlanId" | "postedOn" | "description" | "merchantRaw" | "amountMinor" | "currency" | "baseAmountMinor" | "fxRateMicros" | "entryKind" | "isPending" | "reviewStatus" | "isSplitParent" | "excludeFromBudget" | "excludeFromTotals" | "vatAmountMinor" | "receiptFileId" | "externalRef" | "notes" | "createdAt" | "author" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Trade {
	id: Id<"trades">;
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	securityId: Id<"securities">;
	tradeType: "buy" | "sell" | "dividend" | "split" | "fee";
	executedOn: string;
	quantityMicros: number;
	priceMinor: number;
	feeMinor: number;
	currency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	baseTotalMinor: number;
	notes: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface TradeInsert {
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	securityId: Id<"securities">;
	tradeType?: "buy" | "sell" | "dividend" | "split" | "fee";
	executedOn: string;
	quantityMicros: number;
	priceMinor: number;
	feeMinor?: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	baseTotalMinor: number;
	notes?: string | null;
}
export interface TradePatch {
	entityId?: number;
	accountId?: number;
	securityId?: number;
	tradeType?: "buy" | "sell" | "dividend" | "split" | "fee";
	executedOn?: string;
	quantityMicros?: number;
	priceMinor?: number;
	feeMinor?: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	baseTotalMinor?: number;
	notes?: string | null;
}
export interface TradeWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	accountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	securityId?: true | {
		where?: SecurityFilter;
		orderBy?: SecurityOrder;
		limit?: number;
		offset?: number;
		with?: SecurityWith;
	};
}
export interface TradeFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	accountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	securityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | SecurityFilter;
	tradeType?: "buy" | "sell" | "dividend" | "split" | "fee" | null | {
		eq?: "buy" | "sell" | "dividend" | "split" | "fee" | null;
		ne?: "buy" | "sell" | "dividend" | "split" | "fee" | null;
		gt?: "buy" | "sell" | "dividend" | "split" | "fee";
		gte?: "buy" | "sell" | "dividend" | "split" | "fee";
		lt?: "buy" | "sell" | "dividend" | "split" | "fee";
		lte?: "buy" | "sell" | "dividend" | "split" | "fee";
		in?: ("buy" | "sell" | "dividend" | "split" | "fee")[];
		notIn?: ("buy" | "sell" | "dividend" | "split" | "fee")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	executedOn?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	quantityMicros?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	priceMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	feeMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	baseTotalMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	notes?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: TradeFilter[];
	OR?: TradeFilter[];
	NOT?: TradeFilter;
}
export type TradeOrder = Partial<Record<"id" | "entityId" | "accountId" | "securityId" | "tradeType" | "executedOn" | "quantityMicros" | "priceMinor" | "feeMinor" | "currency" | "baseTotalMinor" | "notes" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Valuation {
	id: Id<"valuations">;
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	valuedOn: string;
	balanceMinor: number;
	currency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	baseBalanceMinor: number;
	source: "manual" | "statement" | "sync";
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface ValuationInsert {
	entityId: Id<"legalEntities">;
	accountId: Id<"accounts">;
	valuedOn: string;
	balanceMinor: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	baseBalanceMinor: number;
	source?: "manual" | "statement" | "sync";
}
export interface ValuationPatch {
	entityId?: number;
	accountId?: number;
	valuedOn?: string;
	balanceMinor?: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	baseBalanceMinor?: number;
	source?: "manual" | "statement" | "sync";
}
export interface ValuationWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	accountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
}
export interface ValuationFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	accountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	valuedOn?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	balanceMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	baseBalanceMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	source?: "manual" | "statement" | "sync" | null | {
		eq?: "manual" | "statement" | "sync" | null;
		ne?: "manual" | "statement" | "sync" | null;
		gt?: "manual" | "statement" | "sync";
		gte?: "manual" | "statement" | "sync";
		lt?: "manual" | "statement" | "sync";
		lte?: "manual" | "statement" | "sync";
		in?: ("manual" | "statement" | "sync")[];
		notIn?: ("manual" | "statement" | "sync")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: ValuationFilter[];
	OR?: ValuationFilter[];
	NOT?: ValuationFilter;
}
export type ValuationOrder = Partial<Record<"id" | "entityId" | "accountId" | "valuedOn" | "balanceMinor" | "currency" | "baseBalanceMinor" | "source" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface FxRate {
	id: Id<"fxRates">;
	fromCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	toCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	rateDate: string;
	rateMicros: number;
	source: "ecb" | "tcmb" | "wise" | "manual";
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface FxRateInsert {
	fromCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	toCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	rateDate: string;
	rateMicros: number;
	source?: "ecb" | "tcmb" | "wise" | "manual";
}
export interface FxRatePatch {
	fromCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	toCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	rateDate?: string;
	rateMicros?: number;
	source?: "ecb" | "tcmb" | "wise" | "manual";
}
export interface FxRateWith {}
export interface FxRateFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	fromCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	toCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	rateDate?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	rateMicros?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	source?: "ecb" | "tcmb" | "wise" | "manual" | null | {
		eq?: "ecb" | "tcmb" | "wise" | "manual" | null;
		ne?: "ecb" | "tcmb" | "wise" | "manual" | null;
		gt?: "ecb" | "tcmb" | "wise" | "manual";
		gte?: "ecb" | "tcmb" | "wise" | "manual";
		lt?: "ecb" | "tcmb" | "wise" | "manual";
		lte?: "ecb" | "tcmb" | "wise" | "manual";
		in?: ("ecb" | "tcmb" | "wise" | "manual")[];
		notIn?: ("ecb" | "tcmb" | "wise" | "manual")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: FxRateFilter[];
	OR?: FxRateFilter[];
	NOT?: FxRateFilter;
}
export type FxRateOrder = Partial<Record<"id" | "fromCurrency" | "toCurrency" | "rateDate" | "rateMicros" | "source" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface IngestProposal {
	id: Id<"ingestProposals">;
	ingestItemId: Id<"ingestItems">;
	targetKind: "entry" | "transfer" | "installment" | "trade";
	postedOn: string;
	description: string;
	merchantRaw: string | null;
	amountMinor: number;
	currency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	suggestedEntityId: Id<"legalEntities"> | null;
	suggestedAccountId: Id<"accounts"> | null;
	suggestedCategoryId: Id<"categories"> | null;
	entryKind: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
	installmentCount: number | null;
	confidenceBps: number;
	status: "pending" | "approved" | "rejected" | "applied";
	appliedEntryId: number | null;
	rawJson: string | null;
	author: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface IngestProposalInsert {
	ingestItemId: Id<"ingestItems">;
	targetKind?: "entry" | "transfer" | "installment" | "trade";
	postedOn: string;
	description: string;
	merchantRaw?: string | null;
	amountMinor: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	suggestedEntityId?: Id<"legalEntities"> | null;
	suggestedAccountId?: Id<"accounts"> | null;
	suggestedCategoryId?: Id<"categories"> | null;
	entryKind?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
	installmentCount?: number | null;
	confidenceBps?: number;
	status?: "pending" | "approved" | "rejected" | "applied";
	appliedEntryId?: number | null;
	rawJson?: string | null;
}
export interface IngestProposalPatch {
	ingestItemId?: number;
	targetKind?: "entry" | "transfer" | "installment" | "trade";
	postedOn?: string;
	description?: string;
	merchantRaw?: string | null;
	amountMinor?: number;
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	suggestedEntityId?: number | null;
	suggestedAccountId?: number | null;
	suggestedCategoryId?: number | null;
	entryKind?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
	installmentCount?: number | null;
	confidenceBps?: number;
	status?: "pending" | "approved" | "rejected" | "applied";
	appliedEntryId?: number | null;
	rawJson?: string | null;
}
export interface IngestProposalWith {
	ingestItemId?: true | {
		where?: IngestItemFilter;
		orderBy?: IngestItemOrder;
		limit?: number;
		offset?: number;
		with?: IngestItemWith;
	};
	suggestedEntityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	suggestedAccountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
	suggestedCategoryId?: true | {
		where?: CategoryFilter;
		orderBy?: CategoryOrder;
		limit?: number;
		offset?: number;
		with?: CategoryWith;
	};
}
export interface IngestProposalFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	ingestItemId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | IngestItemFilter;
	targetKind?: "entry" | "transfer" | "installment" | "trade" | null | {
		eq?: "entry" | "transfer" | "installment" | "trade" | null;
		ne?: "entry" | "transfer" | "installment" | "trade" | null;
		gt?: "entry" | "transfer" | "installment" | "trade";
		gte?: "entry" | "transfer" | "installment" | "trade";
		lt?: "entry" | "transfer" | "installment" | "trade";
		lte?: "entry" | "transfer" | "installment" | "trade";
		in?: ("entry" | "transfer" | "installment" | "trade")[];
		notIn?: ("entry" | "transfer" | "installment" | "trade")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	postedOn?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	description?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	merchantRaw?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	amountMinor?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	currency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null | {
		eq?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		ne?: "EUR" | "TRY" | "USD" | "GBP" | "CHF" | null;
		gt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		gte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lt?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		lte?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
		in?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		notIn?: ("EUR" | "TRY" | "USD" | "GBP" | "CHF")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	suggestedEntityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	suggestedAccountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	suggestedCategoryId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | CategoryFilter;
	entryKind?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment" | null | {
		eq?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment" | null;
		ne?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment" | null;
		gt?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
		gte?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
		lt?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
		lte?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
		in?: ("expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment")[];
		notIn?: ("expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	installmentCount?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	confidenceBps?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	status?: "pending" | "approved" | "rejected" | "applied" | null | {
		eq?: "pending" | "approved" | "rejected" | "applied" | null;
		ne?: "pending" | "approved" | "rejected" | "applied" | null;
		gt?: "pending" | "approved" | "rejected" | "applied";
		gte?: "pending" | "approved" | "rejected" | "applied";
		lt?: "pending" | "approved" | "rejected" | "applied";
		lte?: "pending" | "approved" | "rejected" | "applied";
		in?: ("pending" | "approved" | "rejected" | "applied")[];
		notIn?: ("pending" | "approved" | "rejected" | "applied")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	appliedEntryId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	rawJson?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: IngestProposalFilter[];
	OR?: IngestProposalFilter[];
	NOT?: IngestProposalFilter;
}
export type IngestProposalOrder = Partial<Record<"id" | "ingestItemId" | "targetKind" | "postedOn" | "description" | "merchantRaw" | "amountMinor" | "currency" | "suggestedEntityId" | "suggestedAccountId" | "suggestedCategoryId" | "entryKind" | "installmentCount" | "confidenceBps" | "status" | "appliedEntryId" | "rawJson" | "author" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Grant {
	id: Id<"grants">;
	userId: number;
	entityId: Id<"legalEntities"> | null;
	accountId: Id<"accounts"> | null;
	role: "viewer" | "accountant" | "editor" | "admin";
	scope: "full" | "tax_only" | "read_only";
	dateFrom: string | null;
	dateTo: string | null;
	maskAmounts: boolean;
	revokedAt: string | null;
	createdAt: string;
	author: number | null;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface GrantInsert {
	userId: number;
	entityId?: Id<"legalEntities"> | null;
	accountId?: Id<"accounts"> | null;
	role?: "viewer" | "accountant" | "editor" | "admin";
	scope?: "full" | "tax_only" | "read_only";
	dateFrom?: string | null;
	dateTo?: string | null;
	maskAmounts?: boolean;
	revokedAt?: string | null;
	createdAt?: string;
}
export interface GrantPatch {
	userId?: number;
	entityId?: number | null;
	accountId?: number | null;
	role?: "viewer" | "accountant" | "editor" | "admin";
	scope?: "full" | "tax_only" | "read_only";
	dateFrom?: string | null;
	dateTo?: string | null;
	maskAmounts?: boolean;
	revokedAt?: string | null;
	createdAt?: string;
}
export interface GrantWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	accountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
}
export interface GrantFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	userId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	accountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	role?: "viewer" | "accountant" | "editor" | "admin" | null | {
		eq?: "viewer" | "accountant" | "editor" | "admin" | null;
		ne?: "viewer" | "accountant" | "editor" | "admin" | null;
		gt?: "viewer" | "accountant" | "editor" | "admin";
		gte?: "viewer" | "accountant" | "editor" | "admin";
		lt?: "viewer" | "accountant" | "editor" | "admin";
		lte?: "viewer" | "accountant" | "editor" | "admin";
		in?: ("viewer" | "accountant" | "editor" | "admin")[];
		notIn?: ("viewer" | "accountant" | "editor" | "admin")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	scope?: "full" | "tax_only" | "read_only" | null | {
		eq?: "full" | "tax_only" | "read_only" | null;
		ne?: "full" | "tax_only" | "read_only" | null;
		gt?: "full" | "tax_only" | "read_only";
		gte?: "full" | "tax_only" | "read_only";
		lt?: "full" | "tax_only" | "read_only";
		lte?: "full" | "tax_only" | "read_only";
		in?: ("full" | "tax_only" | "read_only")[];
		notIn?: ("full" | "tax_only" | "read_only")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	dateFrom?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	dateTo?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	maskAmounts?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	revokedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: GrantFilter[];
	OR?: GrantFilter[];
	NOT?: GrantFilter;
}
export type GrantOrder = Partial<Record<"id" | "userId" | "entityId" | "accountId" | "role" | "scope" | "dateFrom" | "dateTo" | "maskAmounts" | "revokedAt" | "createdAt" | "author" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Invitation {
	id: Id<"invitations">;
	recipientEmail: string;
	token: string;
	entityId: Id<"legalEntities"> | null;
	role: "viewer" | "accountant" | "editor";
	scope: "full" | "tax_only" | "read_only";
	dateFrom: string | null;
	dateTo: string | null;
	status: "pending" | "accepted" | "revoked" | "expired";
	expiresAt: string;
	acceptedByUserId: number | null;
	createdAt: string;
	author: number | null;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface InvitationInsert {
	recipientEmail: string;
	token?: string;
	entityId?: Id<"legalEntities"> | null;
	role?: "viewer" | "accountant" | "editor";
	scope?: "full" | "tax_only" | "read_only";
	dateFrom?: string | null;
	dateTo?: string | null;
	status?: "pending" | "accepted" | "revoked" | "expired";
	expiresAt: string;
	acceptedByUserId?: number | null;
	createdAt?: string;
}
export interface InvitationPatch {
	recipientEmail?: string;
	token?: string;
	entityId?: number | null;
	role?: "viewer" | "accountant" | "editor";
	scope?: "full" | "tax_only" | "read_only";
	dateFrom?: string | null;
	dateTo?: string | null;
	status?: "pending" | "accepted" | "revoked" | "expired";
	expiresAt?: string;
	acceptedByUserId?: number | null;
	createdAt?: string;
}
export interface InvitationWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
}
export interface InvitationFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	recipientEmail?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	token?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	role?: "viewer" | "accountant" | "editor" | null | {
		eq?: "viewer" | "accountant" | "editor" | null;
		ne?: "viewer" | "accountant" | "editor" | null;
		gt?: "viewer" | "accountant" | "editor";
		gte?: "viewer" | "accountant" | "editor";
		lt?: "viewer" | "accountant" | "editor";
		lte?: "viewer" | "accountant" | "editor";
		in?: ("viewer" | "accountant" | "editor")[];
		notIn?: ("viewer" | "accountant" | "editor")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	scope?: "full" | "tax_only" | "read_only" | null | {
		eq?: "full" | "tax_only" | "read_only" | null;
		ne?: "full" | "tax_only" | "read_only" | null;
		gt?: "full" | "tax_only" | "read_only";
		gte?: "full" | "tax_only" | "read_only";
		lt?: "full" | "tax_only" | "read_only";
		lte?: "full" | "tax_only" | "read_only";
		in?: ("full" | "tax_only" | "read_only")[];
		notIn?: ("full" | "tax_only" | "read_only")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	dateFrom?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	dateTo?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	status?: "pending" | "accepted" | "revoked" | "expired" | null | {
		eq?: "pending" | "accepted" | "revoked" | "expired" | null;
		ne?: "pending" | "accepted" | "revoked" | "expired" | null;
		gt?: "pending" | "accepted" | "revoked" | "expired";
		gte?: "pending" | "accepted" | "revoked" | "expired";
		lt?: "pending" | "accepted" | "revoked" | "expired";
		lte?: "pending" | "accepted" | "revoked" | "expired";
		in?: ("pending" | "accepted" | "revoked" | "expired")[];
		notIn?: ("pending" | "accepted" | "revoked" | "expired")[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	expiresAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	acceptedByUserId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: InvitationFilter[];
	OR?: InvitationFilter[];
	NOT?: InvitationFilter;
}
export type InvitationOrder = Partial<Record<"id" | "recipientEmail" | "token" | "entityId" | "role" | "scope" | "dateFrom" | "dateTo" | "status" | "expiresAt" | "acceptedByUserId" | "createdAt" | "author" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface ShareLink {
	id: Id<"shareLinks">;
	label: string;
	token: string;
	entityId: Id<"legalEntities"> | null;
	accountId: Id<"accounts"> | null;
	dateFrom: string | null;
	dateTo: string | null;
	includeReceipts: boolean;
	maskCounterparties: boolean;
	revokedAt: string | null;
	expiresAt: string | null;
	createdAt: string;
	author: number | null;
	updatedAt: string;
	deletedAt: string | null;
	deletedBy: number | null;
}
export interface ShareLinkInsert {
	label: string;
	token?: string;
	entityId?: Id<"legalEntities"> | null;
	accountId?: Id<"accounts"> | null;
	dateFrom?: string | null;
	dateTo?: string | null;
	includeReceipts?: boolean;
	maskCounterparties?: boolean;
	revokedAt?: string | null;
	expiresAt?: string | null;
	createdAt?: string;
}
export interface ShareLinkPatch {
	label?: string;
	token?: string;
	entityId?: number | null;
	accountId?: number | null;
	dateFrom?: string | null;
	dateTo?: string | null;
	includeReceipts?: boolean;
	maskCounterparties?: boolean;
	revokedAt?: string | null;
	expiresAt?: string | null;
	createdAt?: string;
}
export interface ShareLinkWith {
	entityId?: true | {
		where?: LegalEntityFilter;
		orderBy?: LegalEntityOrder;
		limit?: number;
		offset?: number;
		with?: LegalEntityWith;
	};
	accountId?: true | {
		where?: AccountFilter;
		orderBy?: AccountOrder;
		limit?: number;
		offset?: number;
		with?: AccountWith;
	};
}
export interface ShareLinkFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	label?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	token?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	entityId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | LegalEntityFilter;
	accountId?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	} | AccountFilter;
	dateFrom?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	dateTo?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	includeReceipts?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	maskCounterparties?: boolean | null | {
		eq?: boolean | null;
		ne?: boolean | null;
		gt?: boolean;
		gte?: boolean;
		lt?: boolean;
		lte?: boolean;
		in?: boolean[];
		notIn?: boolean[];
		isNull?: true;
		isNotNull?: true;
	};
	revokedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	expiresAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	createdAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	author?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	updatedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedAt?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		isNull?: true;
		isNotNull?: true;
	};
	deletedBy?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	AND?: ShareLinkFilter[];
	OR?: ShareLinkFilter[];
	NOT?: ShareLinkFilter;
}
export type ShareLinkOrder = Partial<Record<"id" | "label" | "token" | "entityId" | "accountId" | "dateFrom" | "dateTo" | "includeReceipts" | "maskCounterparties" | "revokedAt" | "expiresAt" | "createdAt" | "author" | "updatedAt" | "deletedAt" | "deletedBy", "asc" | "desc">> | string;
export interface Tag {
	id: Id<"tags">;
	name: string;
	slug: string;
	description: string;
	count: number;
	url: string | null;
	color: string | null;
}
export interface TagInsert {
	name: string;
	slug?: string;
	description?: string;
	color?: string | null;
}
export interface TagPatch {
	name?: string;
	slug?: string;
	description?: string;
	color?: string | null;
}
export interface TagWith {
	memos?: true | {
		where?: FinanceMemoFilter;
		orderBy?: FinanceMemoOrder;
		limit?: number;
		offset?: number;
		with?: FinanceMemoWith;
	};
}
export interface TagFilter {
	id?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	name?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	slug?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	description?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	count?: number | null | {
		eq?: number | null;
		ne?: number | null;
		gt?: number;
		gte?: number;
		lt?: number;
		lte?: number;
		in?: number[];
		notIn?: number[];
		isNull?: true;
		isNotNull?: true;
	};
	url?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	color?: string | null | {
		eq?: string | null;
		ne?: string | null;
		gt?: string;
		gte?: string;
		lt?: string;
		lte?: string;
		in?: string[];
		notIn?: string[];
		like?: string;
		ilike?: string;
		notLike?: string;
		notIlike?: string;
		isNull?: true;
		isNotNull?: true;
	};
	memos?: true | FinanceMemoFilter;
	AND?: TagFilter[];
	OR?: TagFilter[];
	NOT?: TagFilter;
}
export type TagOrder = Partial<Record<"id" | "name" | "slug" | "description" | "count" | "url" | "color", "asc" | "desc">> | string;
export interface FinanceSettings {
	workspaceName: string;
	baseCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	fiscalYearStartMonth: number;
	aiModel: string;
	autoApproveConfidenceBps: number;
	accountantNote: string | null;
}
export interface FinanceSettingsPatch {
	workspaceName?: string;
	baseCurrency?: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	fiscalYearStartMonth?: number;
	aiModel?: string;
	autoApproveConfidenceBps?: number;
	accountantNote?: string | null;
}
export interface RegisterUploadInput {
	fileId: number;
	filename: string;
	mime?: string;
	entityId?: number;
	accountId?: number;
}
export type RegisterUploadOutput = {
	id: number;
	slug: string | null;
	title: string;
};
export interface ApproveProposalInput {
	proposalId: number;
}
export type ApproveProposalOutput = {
	proposalId: number;
	entryId: number;
	status: "applied";
};
export interface RejectProposalInput {
	proposalId: number;
}
export type RejectProposalOutput = {
	proposalId: number;
	status: "rejected";
};
export interface ApplyAllProposalsInput {
	ingestItemId: number;
}
export type ApplyAllProposalsOutput = {
	ingestItemId: number;
	applied: number;
};
export interface RecordEntryInput {
	accountId: string | number;
	categoryId?: string | number;
	postedOn: string;
	description: string;
	amount: string;
	entryKind?: "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
	isPending?: string | boolean;
	notes?: string;
}
export type RecordEntryOutput = {
	id: number;
};
export interface RecordTransferInput {
	fromAccountId: string | number;
	toAccountId: string | number;
	fromAmount: string;
	toAmount?: string;
	feeAmount?: string;
	executedOn: string;
	transferKind?: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";
	reference?: string;
}
export type RecordTransferOutput = {
	id: number;
	kind: "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";
};
export interface SetReviewStatusInput {
	entryId: number;
	reviewStatus?: "unreviewed" | "reviewed" | "flagged";
	excludeFromBudget?: boolean;
	excludeFromTotals?: boolean;
	categoryId?: number | null;
}
export type SetReviewStatusOutput = {
	id: number;
	reviewStatus: "unreviewed" | "reviewed" | "flagged";
	excludeFromBudget: boolean;
	excludeFromTotals: boolean;
};
export interface CreateShareLinkInput {
	label: string;
	entityId?: string | number;
	dateFrom?: string;
	dateTo?: string;
	maskCounterparties?: string | boolean;
}
export type CreateShareLinkOutput = {
	id: number;
	token: string;
};
export interface RevokeShareLinkInput {
	linkId: string | number;
}
export type RevokeShareLinkOutput = {
	id: number;
	revoked: boolean;
};
export interface CreateInvitationInput {
	recipientEmail: string;
	entityId?: string | number;
	role?: "viewer" | "accountant" | "editor";
	scope?: "full" | "tax_only" | "read_only";
}
export type CreateInvitationOutput = {
	id: number;
	token: string;
};
export interface AcceptInvitationInput {
	token: string;
}
export type AcceptInvitationOutput = {
	accepted: boolean;
	role: "viewer" | "accountant" | "editor";
};
export interface RevokeGrantInput {
	grantId: string | number;
}
export type RevokeGrantOutput = {
	id: number;
	revoked: boolean;
};
export type DashboardSummaryInput = Record<string, never>;
export type DashboardSummaryOutput = {
	baseCurrency: "EUR" | "TRY" | "USD" | "GBP" | "CHF";
	netWorthBaseMinor: number;
	accountCount: number;
	unreviewedCount: number;
};
export type SeedDemoDataInput = Record<string, never>;
export type SeedDemoDataOutput = {
	seeded: boolean;
	message: "Workspace already has data.";
} | {
	seeded: boolean;
	message: "Seeded multi-entity demo workspace (Personal, NL B.V., TR Ltd).";
};
export interface Collections {
	legalEntities: {
		row: LegalEntity;
		insert: LegalEntityInsert;
		patch: LegalEntityPatch;
		with: LegalEntityWith;
		filter: LegalEntityFilter;
		order: LegalEntityOrder;
	};
	institutions: {
		row: Institution;
		insert: InstitutionInsert;
		patch: InstitutionPatch;
		with: InstitutionWith;
		filter: InstitutionFilter;
		order: InstitutionOrder;
	};
	accounts: {
		row: Account;
		insert: AccountInsert;
		patch: AccountPatch;
		with: AccountWith;
		filter: AccountFilter;
		order: AccountOrder;
	};
	cards: {
		row: Card;
		insert: CardInsert;
		patch: CardPatch;
		with: CardWith;
		filter: CardFilter;
		order: CardOrder;
	};
	categories: {
		row: Category;
		insert: CategoryInsert;
		patch: CategoryPatch;
		with: CategoryWith;
		filter: CategoryFilter;
		order: CategoryOrder;
	};
	payees: {
		row: Payee;
		insert: PayeeInsert;
		patch: PayeePatch;
		with: PayeeWith;
		filter: PayeeFilter;
		order: PayeeOrder;
	};
	recurringItems: {
		row: RecurringItem;
		insert: RecurringItemInsert;
		patch: RecurringItemPatch;
		with: RecurringItemWith;
		filter: RecurringItemFilter;
		order: RecurringItemOrder;
	};
	securities: {
		row: Security;
		insert: SecurityInsert;
		patch: SecurityPatch;
		with: SecurityWith;
		filter: SecurityFilter;
		order: SecurityOrder;
	};
	ingestItems: {
		row: IngestItem;
		insert: IngestItemInsert;
		patch: IngestItemPatch;
		with: IngestItemWith;
		filter: IngestItemFilter;
		order: IngestItemOrder;
	};
	financeMemos: {
		row: FinanceMemo;
		insert: FinanceMemoInsert;
		patch: FinanceMemoPatch;
		with: FinanceMemoWith;
		filter: FinanceMemoFilter;
		order: FinanceMemoOrder;
	};
	transfers: {
		row: Transfer;
		insert: TransferInsert;
		patch: TransferPatch;
		with: TransferWith;
		filter: TransferFilter;
		order: TransferOrder;
	};
	installmentPlans: {
		row: InstallmentPlan;
		insert: InstallmentPlanInsert;
		patch: InstallmentPlanPatch;
		with: InstallmentPlanWith;
		filter: InstallmentPlanFilter;
		order: InstallmentPlanOrder;
	};
	entries: {
		row: Entry;
		insert: EntryInsert;
		patch: EntryPatch;
		with: EntryWith;
		filter: EntryFilter;
		order: EntryOrder;
	};
	trades: {
		row: Trade;
		insert: TradeInsert;
		patch: TradePatch;
		with: TradeWith;
		filter: TradeFilter;
		order: TradeOrder;
	};
	valuations: {
		row: Valuation;
		insert: ValuationInsert;
		patch: ValuationPatch;
		with: ValuationWith;
		filter: ValuationFilter;
		order: ValuationOrder;
	};
	fxRates: {
		row: FxRate;
		insert: FxRateInsert;
		patch: FxRatePatch;
		with: FxRateWith;
		filter: FxRateFilter;
		order: FxRateOrder;
	};
	ingestProposals: {
		row: IngestProposal;
		insert: IngestProposalInsert;
		patch: IngestProposalPatch;
		with: IngestProposalWith;
		filter: IngestProposalFilter;
		order: IngestProposalOrder;
	};
	grants: {
		row: Grant;
		insert: GrantInsert;
		patch: GrantPatch;
		with: GrantWith;
		filter: GrantFilter;
		order: GrantOrder;
	};
	invitations: {
		row: Invitation;
		insert: InvitationInsert;
		patch: InvitationPatch;
		with: InvitationWith;
		filter: InvitationFilter;
		order: InvitationOrder;
	};
	shareLinks: {
		row: ShareLink;
		insert: ShareLinkInsert;
		patch: ShareLinkPatch;
		with: ShareLinkWith;
		filter: ShareLinkFilter;
		order: ShareLinkOrder;
	};
	tags: {
		row: Tag;
		insert: TagInsert;
		patch: TagPatch;
		with: TagWith;
		filter: TagFilter;
		order: TagOrder;
	};
}
export interface Globals {
	financeSettings: {
		row: FinanceSettings;
		patch: FinanceSettingsPatch;
	};
}
export interface Actions {
	registerUpload: {
		input: RegisterUploadInput;
		output: RegisterUploadOutput;
	};
	approveProposal: {
		input: ApproveProposalInput;
		output: ApproveProposalOutput;
	};
	rejectProposal: {
		input: RejectProposalInput;
		output: RejectProposalOutput;
	};
	applyAllProposals: {
		input: ApplyAllProposalsInput;
		output: ApplyAllProposalsOutput;
	};
	recordEntry: {
		input: RecordEntryInput;
		output: RecordEntryOutput;
	};
	recordTransfer: {
		input: RecordTransferInput;
		output: RecordTransferOutput;
	};
	setReviewStatus: {
		input: SetReviewStatusInput;
		output: SetReviewStatusOutput;
	};
	createShareLink: {
		input: CreateShareLinkInput;
		output: CreateShareLinkOutput;
	};
	revokeShareLink: {
		input: RevokeShareLinkInput;
		output: RevokeShareLinkOutput;
	};
	createInvitation: {
		input: CreateInvitationInput;
		output: CreateInvitationOutput;
	};
	acceptInvitation: {
		input: AcceptInvitationInput;
		output: AcceptInvitationOutput;
	};
	revokeGrant: {
		input: RevokeGrantInput;
		output: RevokeGrantOutput;
	};
	dashboardSummary: {
		input: DashboardSummaryInput;
		output: DashboardSummaryOutput;
	};
	seedDemoData: {
		input: SeedDemoDataInput;
		output: SeedDemoDataOutput;
	};
}
export declare const SCHEMA: {
	readonly name: "ledger";
	readonly app: "ledger";
	readonly abilities: {
		readonly actions: {
			readonly registerUpload: {
				readonly ability: "register-upload";
			};
			readonly approveProposal: {
				readonly ability: "approve-proposal";
			};
			readonly rejectProposal: {
				readonly ability: "reject-proposal";
			};
			readonly applyAllProposals: {
				readonly ability: "apply-all-proposals";
			};
			readonly recordEntry: {
				readonly ability: "record-entry";
			};
			readonly recordTransfer: {
				readonly ability: "record-transfer";
			};
			readonly setReviewStatus: {
				readonly ability: "set-review-status";
			};
			readonly createShareLink: {
				readonly ability: "create-share-link";
			};
			readonly revokeShareLink: {
				readonly ability: "revoke-share-link";
			};
			readonly createInvitation: {
				readonly ability: "create-invitation";
			};
			readonly acceptInvitation: {
				readonly ability: "accept-invitation";
			};
			readonly revokeGrant: {
				readonly ability: "revoke-grant";
			};
			readonly dashboardSummary: {
				readonly ability: "dashboard-summary";
				readonly readonly: true;
				readonly idempotent: true;
			};
			readonly seedDemoData: {
				readonly ability: "seed-demo-data";
			};
		};
		readonly globals: {
			readonly financeSettings: "finance-settings";
		};
	};
	readonly collections: {
		readonly legalEntities: {
			readonly path: "legal_entities";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly accounts: {
					readonly kind: "many";
					readonly collection: "accounts";
					readonly optional: false;
				};
				readonly cards: {
					readonly kind: "many";
					readonly collection: "cards";
					readonly optional: false;
				};
				readonly categories: {
					readonly kind: "many";
					readonly collection: "categories";
					readonly optional: false;
				};
				readonly recurringItems: {
					readonly kind: "many";
					readonly collection: "recurringItems";
					readonly optional: false;
				};
				readonly ingestItems: {
					readonly kind: "many";
					readonly collection: "ingestItems";
					readonly optional: false;
				};
				readonly financeMemos: {
					readonly kind: "many";
					readonly collection: "financeMemos";
					readonly optional: false;
				};
				readonly installmentPlans: {
					readonly kind: "many";
					readonly collection: "installmentPlans";
					readonly optional: false;
				};
				readonly entries: {
					readonly kind: "many";
					readonly collection: "entries";
					readonly optional: false;
				};
				readonly trades: {
					readonly kind: "many";
					readonly collection: "trades";
					readonly optional: false;
				};
				readonly valuations: {
					readonly kind: "many";
					readonly collection: "valuations";
					readonly optional: false;
				};
				readonly ingestProposals: {
					readonly kind: "many";
					readonly collection: "ingestProposals";
					readonly optional: false;
				};
				readonly grants: {
					readonly kind: "many";
					readonly collection: "grants";
					readonly optional: false;
				};
				readonly invitations: {
					readonly kind: "many";
					readonly collection: "invitations";
					readonly optional: false;
				};
				readonly shareLinks: {
					readonly kind: "many";
					readonly collection: "shareLinks";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "legal-entities";
		};
		readonly institutions: {
			readonly path: "institutions";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly accounts: {
					readonly kind: "many";
					readonly collection: "accounts";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "institutions";
		};
		readonly accounts: {
			readonly path: "accounts";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: false;
				};
				readonly institutionId: {
					readonly kind: "one";
					readonly collection: "institutions";
					readonly optional: false;
				};
				readonly cards: {
					readonly kind: "many";
					readonly collection: "cards";
					readonly optional: false;
				};
				readonly recurringItems: {
					readonly kind: "many";
					readonly collection: "recurringItems";
					readonly optional: false;
				};
				readonly ingestItems: {
					readonly kind: "many";
					readonly collection: "ingestItems";
					readonly optional: false;
				};
				readonly installmentPlans: {
					readonly kind: "many";
					readonly collection: "installmentPlans";
					readonly optional: false;
				};
				readonly entries: {
					readonly kind: "many";
					readonly collection: "entries";
					readonly optional: false;
				};
				readonly trades: {
					readonly kind: "many";
					readonly collection: "trades";
					readonly optional: false;
				};
				readonly valuations: {
					readonly kind: "many";
					readonly collection: "valuations";
					readonly optional: false;
				};
				readonly ingestProposals: {
					readonly kind: "many";
					readonly collection: "ingestProposals";
					readonly optional: false;
				};
				readonly grants: {
					readonly kind: "many";
					readonly collection: "grants";
					readonly optional: false;
				};
				readonly shareLinks: {
					readonly kind: "many";
					readonly collection: "shareLinks";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "accounts";
		};
		readonly cards: {
			readonly path: "cards";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: false;
				};
				readonly accountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: false;
				};
				readonly installmentPlans: {
					readonly kind: "many";
					readonly collection: "installmentPlans";
					readonly optional: false;
				};
				readonly entries: {
					readonly kind: "many";
					readonly collection: "entries";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "cards";
		};
		readonly categories: {
			readonly path: "categories";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: true;
				};
				readonly payees: {
					readonly kind: "many";
					readonly collection: "payees";
					readonly optional: false;
				};
				readonly recurringItems: {
					readonly kind: "many";
					readonly collection: "recurringItems";
					readonly optional: false;
				};
				readonly installmentPlans: {
					readonly kind: "many";
					readonly collection: "installmentPlans";
					readonly optional: false;
				};
				readonly entries: {
					readonly kind: "many";
					readonly collection: "entries";
					readonly optional: false;
				};
				readonly ingestProposals: {
					readonly kind: "many";
					readonly collection: "ingestProposals";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "categories";
		};
		readonly payees: {
			readonly path: "payees";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly defaultCategoryId: {
					readonly kind: "one";
					readonly collection: "categories";
					readonly optional: true;
				};
				readonly recurringItems: {
					readonly kind: "many";
					readonly collection: "recurringItems";
					readonly optional: false;
				};
				readonly entries: {
					readonly kind: "many";
					readonly collection: "entries";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "payees";
		};
		readonly recurringItems: {
			readonly path: "recurring_items";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: false;
				};
				readonly accountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: false;
				};
				readonly categoryId: {
					readonly kind: "one";
					readonly collection: "categories";
					readonly optional: true;
				};
				readonly payeeId: {
					readonly kind: "one";
					readonly collection: "payees";
					readonly optional: true;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "recurring-items";
		};
		readonly securities: {
			readonly path: "securities";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly trades: {
					readonly kind: "many";
					readonly collection: "trades";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "securities";
		};
		readonly ingestItems: {
			readonly path: "ingest_items";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: true;
				};
				readonly accountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: true;
				};
				readonly proposals: {
					readonly kind: "many";
					readonly collection: "ingestProposals";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly ["fileId"];
			readonly ability: "ingest-items";
		};
		readonly financeMemos: {
			readonly path: "finance_memos";
			readonly primaryKey: "id";
			readonly drafts: true;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: true;
				};
				readonly tagIds: {
					readonly kind: "many";
					readonly collection: "tags";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "finance-memos";
		};
		readonly transfers: {
			readonly path: "transfers";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly fromAccountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: false;
				};
				readonly toAccountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: false;
				};
				readonly entries: {
					readonly kind: "many";
					readonly collection: "entries";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "transfers";
		};
		readonly installmentPlans: {
			readonly path: "installment_plans";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: false;
				};
				readonly accountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: false;
				};
				readonly cardId: {
					readonly kind: "one";
					readonly collection: "cards";
					readonly optional: true;
				};
				readonly categoryId: {
					readonly kind: "one";
					readonly collection: "categories";
					readonly optional: true;
				};
				readonly entries: {
					readonly kind: "many";
					readonly collection: "entries";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "installment-plans";
		};
		readonly entries: {
			readonly path: "entries";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: false;
				};
				readonly accountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: false;
				};
				readonly cardId: {
					readonly kind: "one";
					readonly collection: "cards";
					readonly optional: true;
				};
				readonly categoryId: {
					readonly kind: "one";
					readonly collection: "categories";
					readonly optional: true;
				};
				readonly payeeId: {
					readonly kind: "one";
					readonly collection: "payees";
					readonly optional: true;
				};
				readonly transferId: {
					readonly kind: "one";
					readonly collection: "transfers";
					readonly optional: true;
				};
				readonly installmentPlanId: {
					readonly kind: "one";
					readonly collection: "installmentPlans";
					readonly optional: true;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly ["receiptFileId"];
			readonly ability: "entries";
		};
		readonly trades: {
			readonly path: "trades";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: false;
				};
				readonly accountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: false;
				};
				readonly securityId: {
					readonly kind: "one";
					readonly collection: "securities";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "trades";
		};
		readonly valuations: {
			readonly path: "valuations";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: false;
				};
				readonly accountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "valuations";
		};
		readonly fxRates: {
			readonly path: "fx_rates";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "fx-rates";
		};
		readonly ingestProposals: {
			readonly path: "ingest_proposals";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly ingestItemId: {
					readonly kind: "one";
					readonly collection: "ingestItems";
					readonly optional: false;
				};
				readonly suggestedEntityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: true;
				};
				readonly suggestedAccountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: true;
				};
				readonly suggestedCategoryId: {
					readonly kind: "one";
					readonly collection: "categories";
					readonly optional: true;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "ingest-proposals";
		};
		readonly grants: {
			readonly path: "grants";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: true;
				};
				readonly accountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: true;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "grants";
		};
		readonly invitations: {
			readonly path: "invitations";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: true;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "invitations";
		};
		readonly shareLinks: {
			readonly path: "share_links";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: true;
			readonly softDelete: true;
			readonly localized: false;
			readonly relations: {
				readonly entityId: {
					readonly kind: "one";
					readonly collection: "legalEntities";
					readonly optional: true;
				};
				readonly accountId: {
					readonly kind: "one";
					readonly collection: "accounts";
					readonly optional: true;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
			readonly ability: "share-links";
		};
		readonly tags: {
			readonly path: "tags";
			readonly primaryKey: "id";
			readonly drafts: false;
			readonly revisions: false;
			readonly softDelete: false;
			readonly localized: false;
			readonly relations: {
				readonly memos: {
					readonly kind: "many";
					readonly collection: "financeMemos";
					readonly optional: false;
				};
			};
			readonly media: readonly [];
			readonly mediaList: readonly [];
			readonly files: readonly [];
		};
	};
	readonly globals: readonly ["financeSettings"];
	readonly actions: readonly ["registerUpload", "approveProposal", "rejectProposal", "applyAllProposals", "recordEntry", "recordTransfer", "setReviewStatus", "createShareLink", "revokeShareLink", "createInvitation", "acceptInvitation", "revokeGrant", "dashboardSummary", "seedDemoData"];
	readonly buckets: readonly ["inboxFiles"];
};
export type SchemaDescriptor = typeof SCHEMA;
type Descriptor = typeof SCHEMA;
type CollectionDescriptors = Descriptor["collections"];
/** Schema keys of every collection (`client.<key>`). */
export type CollectionKey = keyof Collections & keyof CollectionDescriptors & string;
type Row<K extends CollectionKey> = Collections[K]["row"];
type Rels<K extends CollectionKey> = CollectionDescriptors[K]["relations"];
type IdOf<K extends CollectionKey> = Row<K>[CollectionDescriptors[K]["primaryKey"] & keyof Row<K>];
/** `with` keys that load something (`false`/`undefined` entries load nothing). */
type Requested<W> = { [P in keyof W]-?: W[P] extends false | undefined | null ? never : P }[keyof W];
type NestedWith<V> = V extends {
	with: infer W;
} ? W : {};
type RelationValue<
	R,
	V
> = R extends {
	kind: "one";
	collection: infer T extends CollectionKey;
	optional: infer O;
} ? RowWith<T, NestedWith<V>> | (O extends false ? never : null) : R extends {
	kind: "many";
	collection: infer T extends CollectionKey;
} ? RowWith<T, NestedWith<V>>[] : never;
type WithValue<
	K extends CollectionKey,
	P,
	V
> = P extends keyof Rels<K> ? RelationValue<Rels<K>[P], V> : P extends CollectionDescriptors[K]["mediaList"][number] ? Media[] | (null extends Row<K>[P & keyof Row<K>] ? null : never) : P extends CollectionDescriptors[K]["media"][number] ? Media | null : P extends CollectionDescriptors[K]["files"][number] ? PrivateFile | number | (null extends Row<K>[P & keyof Row<K>] ? null : never) : never;
/**
* A row of collection `K` loaded with `with: W`: `one` relations become the related row (or null when
* optional), `many` relations a list, and requested media columns are replaced in place by media rows.
* Requested file columns become the file row when the bucket's read rule admits the viewer, else stay the id.
*/
export type RowWith<
	K extends CollectionKey,
	W
> = [Requested<W>] extends [never] ? Row<K> : ([Requested<W> & keyof Row<K>] extends [never] ? Row<K> : Omit<Row<K>, Requested<W> & keyof Row<K>>) & { -readonly [P in Exclude<Requested<W>, OptionalKeys<Row<K>>>]: WithValue<K, P, W[P]> } & { -readonly [P in Extract<Requested<W>, OptionalKeys<Row<K>>>]?: WithValue<K, P, W[P]> };
type OptionalKeys<T> = { [P in keyof T]-?: {} extends Pick<T, P> ? P : never }[keyof T] & PropertyKey;
/** Rejects `with` keys that are neither relations nor media columns (`with: { autor: true }`). */
type ExactWith<
	K extends CollectionKey,
	W
> = W & { [P in Exclude<keyof W, keyof Collections[K]["with"]>]: never };
type StatusQuery<K extends CollectionKey> = CollectionDescriptors[K]["drafts"] extends true ? {
	/** Shorthand for `where: { status }` (ANDed with `where`). */ status?: Status;
} : {};
type LocaleQuery<K extends CollectionKey> = CollectionDescriptors[K]["localized"] extends true ? {
	/** Rows in this locale, falling back to the default locale per translation group; `"*"` = every row. Default: the default locale. */ locale?: Locale | "*";
} : {};
export type ListQuery<
	K extends CollectionKey,
	W = Collections[K]["with"]
> = {
	where?: Collections[K]["filter"];
	/** `{ createdAt: "desc", title: "asc" }` or the wire form `"-createdAt,title"`. */
	orderBy?: Collections[K]["order"];
	limit?: number;
	offset?: number;
	with?: W;
	/** Soft-delete filter: `"exclude"` (default), `"include"`, or `"only"`. Non-default modes require `restore` or `delete` access. */
	deleted?: "exclude" | "include" | "only";
} & StatusQuery<K> & LocaleQuery<K>;
/**
* A read. Await it for one answer, or `subscribe` to keep it current: the callback gets the result
* now and again whenever it changes, always as this client's visitor reads it.
*/
export interface Query<T> extends Promise<T> {
	/** The same for the same call with the same arguments: what a cache or a hook keys on. */
	readonly key: string;
	/**
	* Calls `onData` with the result, and again each time it changes. `onError` gets the problem of a
	* read the server refuses (a `get` whose row is missing or unreadable is a 404) and network
	* failures; the subscription continues. `seed` is an answer rendered on the server
	* (`TypedPress\Live\Module::evaluate`): its data is delivered at once and its token sent with the
	* first request. Returns a function that ends the subscription.
	*/
	subscribe(onData: (data: T) => void, onError?: (error: TypedPressError) => void, seed?: {
		token: string;
		data: T;
	}): () => void;
	/**
	* Shows subscribers `update(current)` at once, before the server has answered a write. Call
	* `settle()` when the write succeeded (the change stays until the server's next answer replaces
	* it) or `rollback()` when it failed (subscribers get the server's data back).
	*/
	optimistic(update: (current: T) => T): {
		settle(): void;
		rollback(): void;
	};
}
export interface CollectionClient<K extends CollectionKey> {
	list<const W extends Collections[K]["with"] = Extract<{}, Collections[K]["with"]>>(q?: ListQuery<K, ExactWith<K, W>>): Query<RowWith<K, W>[]>;
	/**
	* One page and the `cursor` of the next (null on the last page): pass it back as `cursor`. A page
	* with `offset` can be awaited but not subscribed to (`subscribe` throws): subscribe by `cursor`.
	*/
	paginate<const W extends Collections[K]["with"] = Extract<{}, Collections[K]["with"]>>(q?: ListQuery<K, ExactWith<K, W>> & {
		cursor?: string | null;
	}): Query<{
		rows: RowWith<K, W>[];
		cursor: string | null;
	}>;
	/** With `locale`, the row of `id`'s translation group in that locale (or its fallback). */
	get<const W extends Collections[K]["with"] = Extract<{}, Collections[K]["with"]>>(id: IdOf<K>, q?: {
		with?: ExactWith<K, W>;
	} & LocaleQuery<K>): Query<RowWith<K, W>>;
	/** How many rows `list` with this filter would return without a limit. */
	count(q?: {
		where?: Collections[K]["filter"];
	} & StatusQuery<K> & LocaleQuery<K>): Query<number>;
	create(data: Collections[K]["insert"]): Promise<Row<K>>;
	/**
	* On a collection, add `_rev` (from a read) to the patch to refuse the update when the row changed
	* since: a 409 `stale_revision`. While someone else has the row open in the editor the update is a
	* 409 `locked`; `takeover: true` takes over their edit lock.
	*/
	update(id: IdOf<K>, patch: Collections[K]["patch"] & WriteConditions): Promise<Row<K>>;
	delete(id: IdOf<K>, options?: WriteConditions): Promise<Row<K>>;
	/** Restores a soft-deleted row (and any cascade-deleted children sharing its deletion group). */
	restore(id: IdOf<K>): Promise<Row<K>>;
	/** Permanently removes the row from storage (default access `"system"`). */
	purge(id: IdOf<K>): Promise<Row<K>>;
	/** `list(q).subscribe(onRows, onError)`. Returns a function that stops watching. */
	watch<const W extends Collections[K]["with"] = Extract<{}, Collections[K]["with"]>>(q: ListQuery<K, ExactWith<K, W>> | undefined, onRows: (rows: RowWith<K, W>[]) => void, onError?: (error: TypedPressError) => void): () => void;
	revisions: {
		/** Newest first. Needs `update` access on the row. */
		list(id: IdOf<K>): Promise<RevisionSummary[]>;
		get(id: IdOf<K>, revisionId: number): Promise<Row<K>>;
		/** Diffs two revisions (by version or revision id) as this viewer may read them. */
		diff(id: IdOf<K>, fromVersion: number, toVersion: number): Promise<RevisionDiff<Row<K>>>;
		/** Runs the update pipeline with the revision as the patch; returns the updated row. */
		restore(id: IdOf<K>, revisionId: number): Promise<Row<K>>;
	};
	/**
	* Save `patch` as the item's staged version: the live row stays as it is until `promote`. One
	* staged version per item, shared by everyone who may update it; each call adds to it. Post
	* kinds only. Every staged call needs `update` access on the row, and answers 404 without it.
	*/
	stage(id: IdOf<K>, patch: Collections[K]["patch"] & WriteConditions): Promise<StagedVersion<K>>;
	/** The staged version: the row as it would be once promoted. 404 when nothing is staged. */
	staged(id: IdOf<K>): Promise<StagedVersion<K>>;
	/** The staged fields whose value differs from the live row, with both values. */
	compare(id: IdOf<K>): Promise<StagedComparison<K>>;
	/**
	* Make the staged version live, as an update of the row by the caller. With `at` (a future ISO
	* time) the promote is scheduled instead, and `at: null` cancels a scheduled one; both return
	* the staged version.
	*/
	promote(id: IdOf<K>, options?: WriteConditions): Promise<Row<K>>;
	promote(id: IdOf<K>, options: {
		at: string | null;
	} & WriteConditions): Promise<StagedVersion<K>>;
	/** End the staged version. It stays in the row's revisions, as `revision`. */
	discard(id: IdOf<K>, options?: WriteConditions): Promise<{
		revision: number;
	}>;
	/** A signed link to the staged version that works without signing in for `ttl` seconds (an hour by default). */
	previewLink(id: IdOf<K>, options?: {
		ttl?: number;
	}): Promise<StagedPreview>;
}
/** A staged version: the row once promoted, the fields that are staged, who staged last. */
/**
* A write's conditions on a collection's row: `_rev`, the token a read returned (the row's own, or a
* staged version's for stage, promote and discard), refuses the write if the row changed since;
* `takeover` takes over another user's edit lock.
*/
export interface WriteConditions {
	_rev?: string;
	takeover?: boolean;
}
export interface StagedVersion<K extends CollectionKey> {
	/** The revision holding it. */
	id: number;
	row: Row<K>;
	fields: (keyof Row<K> & string)[];
	by: {
		id: number;
		name: string;
	} | null;
	at: string;
	/** When a scheduled promote runs, or null. */
	promoteAt: string | null;
	/** The staged version's token, for the next stage, promote or discard. */
	_rev: string;
	/** Why the last scheduled promote did not run. */
	error?: {
		code: string;
		detail: string;
		at: string;
	};
}
export interface StagedComparison<K extends CollectionKey> extends Omit<StagedVersion<K>, "row" | "fields"> {
	changes: { [F in keyof Row<K> & string]: {
		field: F;
		live: Row<K>[F];
		staged: Row<K>[F];
	} }[keyof Row<K> & string][];
}
export interface StagedPreview {
	token: string;
	expiresAt: string;
	/** Reads the staged version without signing in. */
	api: string;
	/** The item's own page showing the staged version, when the kind has a public URL. */
	url: string | null;
}
export interface MediaQuery {
	where?: Record<string, unknown>;
	orderBy?: Record<string, "asc" | "desc"> | string;
	limit?: number;
	offset?: number;
}
export interface MediaClient {
	list(q?: MediaQuery): Promise<Media[]>;
	get(id: number): Promise<Media>;
	/** `multipart/form-data` with fields `file` and `alt`. */
	upload(file: Blob, opts?: {
		alt?: string;
		filename?: string;
	}): Promise<Media>;
	/** Editors only. A new `focal` point (0..1 from the top-left) regenerates every `cover` size. */
	update(id: number, patch: {
		alt?: string | null;
		focal?: {
			x: number;
			y: number;
		} | null;
	}): Promise<Media>;
	delete(id: number): Promise<Media>;
}
export interface FileBucketClient {
	/** `multipart/form-data` field `file`; the bucket's `accept`, `maxBytes` and `create` rule apply. */
	upload(file: Blob, opts?: {
		filename?: string;
	}): Promise<PrivateFile>;
	/** The row with a fresh `url`: a signed download link valid for 5 minutes. */
	get(id: number): Promise<PrivateFile>;
	delete(id: number): Promise<PrivateFile>;
}
export type FilesClient = { readonly [B in Descriptor["buckets"][number]]: FileBucketClient };
export type ActionsClient = { [A in keyof Actions]: {} extends Actions[A]["input"] ? (input?: Actions[A]["input"]) => Promise<Actions[A]["output"]> : (input: Actions[A]["input"]) => Promise<Actions[A]["output"]> };
export type GlobalsClient = { [G in keyof Globals]: {
	get(): Promise<Globals[G]["row"]>;
	update(patch: Globals[G]["patch"]): Promise<Globals[G]["row"]>;
} };
/** The tokens a signed-in client holds (`auth.session()`). */
export interface Session {
	accessToken: string;
	refreshToken: string;
	/** Epoch milliseconds. */
	expiresAt: number;
}
export interface AuthClient {
	/** Redirects to `<issuer>/authorize` (PKCE S256); the promise never settles. */
	signIn(opts?: {
		returnTo?: string;
	}): Promise<never>;
	/** On the redirect URI: exchanges `?code` at `<issuer>/token`, keeps the tokens, returns the user. */
	handleCallback(): Promise<User>;
	/** Starts a guest session (`role: "guest"`) and keeps its tokens. */
	guest(): Promise<User>;
	/** Sends the current guest to the issuer's screens to upgrade in place; never settles. */
	upgrade(): Promise<never>;
	/** The signed-in user (with `member`, the auth collection row, when the app has one), or null. */
	me(): Promise<User | null>;
	/** Revokes the session and forgets the tokens; also signs out at the issuer when `returnTo` is given. */
	signOut(opts?: {
		returnTo?: string;
	}): Promise<void>;
	/** The held tokens, for server-side callers that forward them; null when signed out. */
	session(): Session | null;
}
export type Client = { readonly [K in CollectionKey]: CollectionClient<K> } & {
	readonly media: MediaClient;
	readonly files: FilesClient;
	readonly actions: ActionsClient;
	readonly globals: GlobalsClient;
	readonly auth: AuthClient;
	/** `GET /wp-json/typedpress/v1`: the app's description (kinds, fields, globals, actions), as `typedpress pull` reads it. */
	schema(): Promise<unknown>;
};
/** One committed transaction's changes, as the runtime's `tp_realtime_changes` hook sends them. */
export interface ChangeNotice {
	id: string;
	at: string;
	/** `ids: null` means "some rows changed": too many to list, or ids withheld from a shared room. */
	changes: {
		collection: string;
		ops: ("create" | "update" | "delete")[];
		ids: (string | number)[] | null;
	}[];
}
/**
* Delivers change notices from the host (Cast, a WebSocket relay, Pusher, ...). TypedPress ships none.
* `connect` starts delivery and returns a stop function; call `status("live")` once notices flow
* and `status("down")` when they stop, so the client polls meanwhile.
*/
export interface RealtimeTransport {
	connect(deliver: (notice: ChangeNotice) => void, status: (state: "live" | "down") => void): () => void;
}
export interface RealtimeOptions {
	/** The transport. Default: the one a host registered with `registerRealtimeTransport`; `false` = polling only. */
	transport?: RealtimeTransport | false;
	/**
	* How often subscriptions ask the server while no transport is live. Default: adaptive, between
	* the bounds the server gives (2 s after a change, growing by half up to 30 s while nothing
	* changes, each wait jittered by 20%). `{ min, max }` sets the bounds, a number a fixed interval,
	* and `false` turns polling off. A hidden tab doesn't poll; it asks once when it is shown again.
	*/
	pollMs?: number | false | {
		min?: number;
		max?: number;
	};
	/**
	* A slow safety refresh while the transport is live, covering a notice the transport lost.
	* Default 60000 with up to ±20% jitter per refresh; `false` turns it off.
	*/
	livePollMs?: number | false;
}
/** For host scripts: every client on this page, created before or after, uses this transport by default. */
export declare function registerRealtimeTransport(transport: RealtimeTransport): void;
export interface ClientOptions {
	/**
	* The site's REST root: "https://x.test/wp-json" (or "https://x.test/?rest_route=" without pretty
	* permalinks; WordPress names it in the `Link: <…>; rel="https://api.w.org/"` header of every page).
	* The app's API URL ("https://x.test/wp-json/typedpress/v1") is accepted too, and a site URL without
	* either is taken as its `/wp-json`. Default: the root a TypedPress page names for the client, else
	* `/wp-json` on the page's origin.
	*/
	url?: string;
	/**
	* The app API's route below the REST root, when the site serves it somewhere other than
	* `/typedpress/v1` (`sp_api_namespace`). With it, `url` is taken as the REST root as given, so a
	* site with another REST prefix (`https://x.test/api`) works too. A TypedPress page names both.
	*/
	api?: string;
	/**
	* Use what a WordPress page prints for the client (`wp-script-module-data-@typedpress/client`): its
	* REST root and the app API's namespace (unless `url` is given), and a signed-in visitor's REST
	* nonce (unless `fetch`, `headers`, `nonce` or `auth` brings another credential; `true` uses it
	* anyway). Default: on; `false` ignores the page.
	*/
	wordpress?: boolean;
	/** WordPress cookie auth: the REST nonce; sent as `X-WP-Nonce` with `credentials: "same-origin"`. */
	nonce?: string;
	fetch?: typeof fetch;
	/** Extra headers on every request (e.g. `Authorization: Basic ...` for application passwords). They win over the above. */
	headers?: Record<string, string>;
	/** Frontend sign-in (design §6.2). */
	auth?: AuthOptions;
	/** Live updates for `subscribe` and `watch`. */
	realtime?: RealtimeOptions;
}
export interface AuthOptions {
	/** The typedpress-identity OIDC issuer (`https://x.test/identity`). Default: `issuer` from `GET /auth/config`. */
	issuer?: string;
	/** The registered application's client id. */
	clientId?: string;
	/** Where the issuer sends the browser back (the page that calls `handleCallback()`). */
	redirectUri?: string;
	/** Where tokens live: in memory (default) or `sessionStorage` under `typedpress.auth:<base url>`. */
	storage?: "memory" | "session";
	/** A write rejected as unauthenticated while signed out starts a guest session and is retried once. */
	guests?: boolean;
}
/** RFC 9457 problem document, as the runtime sends it. */
export interface Problem {
	type: string;
	title: string;
	status: number;
	code: string;
	detail: string;
	pointer?: string;
}
/** Thrown for every non-2xx response; the fields are the problem document. Network failures: status 0, code "network". */
export declare class TypedPressError extends Error {
	readonly status: number;
	readonly code: string;
	readonly detail: string;
	readonly title: string;
	readonly type: string;
	readonly pointer?: string;
	constructor(problem: Problem);
}
export declare function createClient(options?: ClientOptions): Client;
/**
* Runs `read` now and again whenever one of `collections` (schema keys) changes, while `client`'s
* transport is live, or on its polling interval otherwise. For reads a `subscribe` can't express:
* an action's result, a global. Returns a function that stops watching.
*/
export declare function watch<T>(client: Client, collections: readonly CollectionKey[], read: () => Promise<T>, onResult: (value: T) => void, onError?: (error: TypedPressError) => void): () => void;
export {};
